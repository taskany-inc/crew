import {
    UserCreationRequest,
    Prisma,
    User,
    PermissionService,
    OrganizationUnit,
    Attach,
    UserService,
} from 'prisma/prisma-client';
import { TRPCError } from '@trpc/server';
import { ICalCalendarMethod } from 'ical-generator';
import { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/postgres';
import { UpdateObjectExpression } from 'kysely/dist/cjs/parser/update-set-parser';
import { sql, SqlBool, ExpressionOrFactory } from 'kysely';

import { prisma } from '../utils/prisma';
import { supplementalPositionsDate } from '../utils/dateTime';
import { trimAndJoin } from '../utils/trimAndJoin';
import { config } from '../config';
import {
    sendNewCommerEmails,
    userCreationMailText,
    transferInternToStaffEmailHtml,
    sendDecreeEmails,
} from '../utils/emailTemplates';
import { createJob } from '../worker/create';
import { jobUpdate, jobDelete } from '../worker/jobOperations';
import { percentageMultiply } from '../utils/suplementPosition';
import {
    DB,
    PositionStatus,
    UserCreationRequestStatus,
    User as KyselyUser,
    SupplementalPosition as KyselySupplementalPosition,
} from '../generated/kyselyTypes';
import { pages } from '../hooks/useRouter';
import { ExternalServiceName, findService } from '../utils/externalServices';
import { findCorporateMail, findSigmaMail } from '../utils/organizationalDomains';
import { db } from '../utils/db';
import { JsonValue } from '../utils/jsonValue';
import { ExtractTypeFromGenerated } from '../utils/extractTypeFromGenerated';
import { getCorporateEmail } from '../utils/getCorporateEmail';

import { userMethods } from './userMethods';
import { calendarEvents, createIcalEventData, sendMail } from './nodemailer';
import { tr } from './modules.i18n';
import {
    CreateTransferInside,
    CreateUserCreationRequest,
    CreateUserCreationRequestExternalEmployee,
    CreateUserCreationRequestexternalFromMainOrgEmployee,
    CreateUserCreationRequestInternalEmployee,
    EditTransferInternToStaff,
    EditUserCreationRequest,
    GetUserCreationRequestList,
    HandleUserCreationRequest,
    TransferInternToStaff,
    UserDecreeEditSchema,
    UserDecreeSchema,
    CreateUserCreationRequestDraft,
    EditTransferInside,
} from './userCreationRequestSchemas';
import {
    CompleteUserCreationRequest,
    BaseUserCreationRequest,
    UserDecreeRequest,
    UserCreationRequestWithRelations,
    UserCreationRequestType,
    SupplementalPositionWithUnit,
} from './userCreationRequestTypes';
import { groupMethods } from './groupMethods';
import { serviceMethods } from './serviceMethods';
import { locationMethods } from './locationMethods';
import { groupRoleMethods } from './groupRoleMethods';
import { sendDismissalEmails } from './scheduledDeactivationMethods';
import { supplementalPositionMethods } from './supplementalPositionMethods';

const sendTransferInternToStaffEmail = async (
    request: UserCreationRequest,
    method: ICalCalendarMethod.REQUEST | ICalCalendarMethod.CANCEL,
    sessionUserId: string,
) => {
    if (!request.date) return;

    const transferToOrganization = await db
        .selectFrom('OrganizationUnit')
        .select('name')
        .where('id', '=', request.organizationUnitId)
        .executeTakeFirstOrThrow();

    const groups = request.groupId
        ? `> ${(await groupMethods.getBreadcrumbs(request.groupId)).map(({ name }) => name).join('>')}`
        : '';

    const transferTo = `${transferToOrganization.name} ${groups}`;

    const transferFromOrganization = await db
        .selectFrom('OrganizationUnit')
        .select('name')
        .where('id', '=', request.internshipOrganizationId)
        .executeTakeFirstOrThrow();

    const transferFrom = `${transferFromOrganization.name}${
        request.internshipOrganizationGroup ? ` > ${request.internshipOrganizationGroup}` : ''
    }`;

    const supervisor = request.supervisorId ? await userMethods.getByIdOrThrow(request.supervisorId) : undefined;
    const appConfig = await db.selectFrom('AppConfig').select('corporateAppName').executeTakeFirstOrThrow();

    const { corporateAppName } = appConfig;

    const sigmaMail = await findSigmaMail([request.email, request.workEmail, request.email]);

    const userServices = request.userTargetId && (await serviceMethods.getUserServices(request.userTargetId));

    const phone = userServices && findService(ExternalServiceName.Phone, userServices);

    const subject = `${tr('Transfer intern to staff')} ${transferToOrganization.name} ${request.name}${
        phone ? ` (${phone})` : ''
    }`;

    request.date?.setUTCHours(config.employmentUtcHour + 1);

    const additionalEmails = [sessionUserId];

    if (request.creatorId && request.creatorId !== sessionUserId) additionalEmails.push(request.creatorId);

    if (request.supervisorId) additionalEmails.push(request.supervisorId);

    const { users, to } = await userMethods.getMailingList(
        'createScheduledUserRequest',
        [request.organizationUnitId],
        additionalEmails,
        !!request.workSpace,
    );

    const icalEvent = createIcalEventData({
        id: request.id + config.nodemailer.authUser + request.organizationUnitId,
        start: request.date,
        duration: 30,
        users,
        summary: subject,
        description: subject,
    });

    const html = transferInternToStaffEmailHtml({
        request,
        transferFrom,
        transferTo,
        sigmaMail,
        supervisorName: supervisor?.name || '',
        corporateAppName,
    });

    await sendMail({
        to,
        subject,
        html,
        icalEvent: calendarEvents({
            method,
            events: [icalEvent],
        }),
    });
};

const sendDismissalEmailsOnTransferInside = async (data: {
    request: UserCreationRequest;
    mainPosition: SupplementalPositionWithUnit;
    user: User;
    supplementalPositions: SupplementalPositionWithUnit[];
    sessionUserId: string;
    date: Date;
    attaches: Attach[];
    phone: string;
    lineManagerIds: string[];
    coordinatorIds: string[];
    method: ICalCalendarMethod.REQUEST | ICalCalendarMethod.CANCEL;
}) => {
    const {
        request,
        mainPosition,
        user,
        supplementalPositions,
        sessionUserId,
        attaches,
        phone,
        date,
        coordinatorIds,
        lineManagerIds,
        method,
    } = data;
    const mails = [request.workEmail, request.email, request.personalEmail];

    const sigmaMail = await findSigmaMail(mails);

    const corporateMail = await findCorporateMail(mails);

    if (!mainPosition) {
        throw new TRPCError({
            message: `no main supplemental position to cancel event in transfer inside request with id ${request.id}}`,
            code: 'NOT_FOUND',
        });
    }
    const transferFromSupervisor = await db
        .selectFrom('User')
        .selectAll()
        .where('id', '=', request.supervisorId)
        .executeTakeFirst();

    await sendDismissalEmails({
        request: { ...request, user },
        method,
        supplementalPositions,
        organization: mainPosition?.organizationUnit,
        teamlead: transferFromSupervisor?.name || '',
        role: request.title || '',
        sessionUserId,
        attaches,
        phone,
        sigmaMail,
        corporateMail,
        lineManagerIds,
        coordinatorIds,
        organizationalGroupId: request.groupId,
        userId: user.id,
        comment: request.comment,
        workPlace: request.workSpace,
        date,
    });
};

const sendNewCommerEmailsOnTransferInside = async (data: {
    request: UserCreationRequest;
    sessionUserId: string;
    method: ICalCalendarMethod.REQUEST | ICalCalendarMethod.CANCEL;
    transferToSupervisorId?: string | null;
    services: UserService[];
    transferToSupplementalPositions: SupplementalPositionWithUnit[];
    transferToGroupId?: string | null;
    organization: OrganizationUnit;
    transferDate: Date;
    lineManagers: Omit<User, 'roleDeprecated'>[];
    coordinators: Omit<User, 'roleDeprecated'>[];
}) => {
    const {
        request,
        sessionUserId,
        method,
        transferToSupervisorId,
        services,
        transferToSupplementalPositions,
        transferToGroupId,
        organization,
        transferDate,
        lineManagers,
        coordinators,
    } = data;

    const transferToSupervisor =
        transferToSupervisorId &&
        (await db.selectFrom('User').selectAll().where('id', '=', transferToSupervisorId).executeTakeFirst());

    const transferToGroup = transferToGroupId
        ? await db.selectFrom('Group').selectAll().where('id', '=', transferToGroupId).executeTakeFirst()
        : undefined;

    await sendNewCommerEmails({
        request: {
            ...request,
            lineManagers,
            coordinators,
            date: transferDate,
            title: request.transferToTitle,
            supplementalPositions: transferToSupplementalPositions,
            supervisor: transferToSupervisor || null,
            organization,
            group: transferToGroup,
            services: services.map(({ serviceName, serviceId }) => ({ serviceName, serviceId })),
        },
        method,
        sessionUserId,
    });
};

const getUserCreationRequestBase = async (
    where: ExpressionOrFactory<DB, 'UserCreationRequest', SqlBool>,
): Promise<UserCreationRequestWithRelations | null> => {
    const request = await db
        .selectFrom('UserCreationRequest')
        .where(where)
        .selectAll()
        .select([
            (eb) =>
                jsonObjectFrom(
                    eb.selectFrom('Group').selectAll().whereRef('Group.id', '=', 'UserCreationRequest.groupId'),
                ).as('group'),
            (eb) =>
                jsonObjectFrom(
                    eb
                        .selectFrom('OrganizationUnit')
                        .selectAll()
                        .whereRef('OrganizationUnit.id', '=', 'UserCreationRequest.organizationUnitId'),
                ).as('organization'),
            (eb) =>
                jsonObjectFrom(
                    eb.selectFrom('User').selectAll().whereRef('User.id', '=', 'UserCreationRequest.supervisorId'),
                ).as('supervisor'),
            (eb) =>
                jsonObjectFrom(
                    eb.selectFrom('User').selectAll().whereRef('User.id', '=', 'UserCreationRequest.buddyId'),
                ).as('buddy'),
            (eb) =>
                jsonObjectFrom(
                    eb.selectFrom('User').selectAll().whereRef('User.id', '=', 'UserCreationRequest.recruiterId'),
                ).as('recruiter'),
            (eb) =>
                jsonObjectFrom(
                    eb.selectFrom('User').selectAll().whereRef('User.id', '=', 'UserCreationRequest.creatorId'),
                ).as('creator'),
            (eb) =>
                jsonArrayFrom(
                    eb
                        .selectFrom('_userCoordinators')
                        .innerJoin('User', 'User.id', '_userCoordinators.A')
                        .selectAll('User')
                        .whereRef('_userCoordinators.B', '=', 'UserCreationRequest.id'),
                ).as('coordinators'),
            (eb) =>
                jsonArrayFrom(
                    eb
                        .selectFrom('_userLineManagers')
                        .innerJoin('User', 'User.id', '_userLineManagers.A')
                        .selectAll('User')
                        .whereRef('_userLineManagers.B', '=', 'UserCreationRequest.id'),
                ).as('lineManagers'),
            (eb) =>
                jsonArrayFrom(
                    eb
                        .selectFrom('_userCurators')
                        .innerJoin('User', 'User.id', '_userCurators.A')
                        .selectAll('User')
                        .whereRef('_userCurators.B', '=', 'UserCreationRequest.id'),
                ).as('curators'),
            (eb) =>
                jsonArrayFrom(
                    eb
                        .selectFrom('_PermissionServiceToUserCreationRequest')
                        .innerJoin(
                            'PermissionService',
                            'PermissionService.id',
                            '_PermissionServiceToUserCreationRequest.A',
                        )
                        .selectAll('PermissionService')
                        .whereRef('_PermissionServiceToUserCreationRequest.B', '=', 'UserCreationRequest.id'),
                ).as('permissionServices'),
        ])
        .$castTo<UserCreationRequestWithRelations>()
        .executeTakeFirst();

    if (!request) return null;

    const supplementalPositions = await db
        .selectFrom('SupplementalPosition as sp')
        .where('sp.userCreationRequestId', '=', request.id)
        .selectAll('sp')
        .select((eb) => [
            jsonObjectFrom(
                eb
                    .selectFrom('OrganizationUnit')
                    .selectAll()
                    .whereRef('OrganizationUnit.id', '=', 'sp.organizationUnitId'),
            ).as('organizationUnit'),
        ])
        .$castTo<UserCreationRequestWithRelations['supplementalPositions'][number]>()
        .execute();

    return {
        ...request,
        supplementalPositions: supplementalPositions ?? [],
    };
};

const getUserCreationRequestById = async (id: string) =>
    getUserCreationRequestBase((eb) => eb('UserCreationRequest.id', '=', id));

const getUserCreationRequestByExternalPersonId = async (externalPersonId: string) =>
    getUserCreationRequestBase((eb) => eb('UserCreationRequest.externalPersonId', '=', externalPersonId));

export const findUsersByEmails = async (
    emails: string[],
): Promise<Record<string, ExtractTypeFromGenerated<KyselyUser>>> => {
    if (!emails.length) return {};

    const users = await db
        .selectFrom('User')
        .leftJoin('UserServices', (join) =>
            join
                .onRef('UserServices.userId', '=', 'User.id')
                .on('UserServices.serviceName', 'in', [
                    ExternalServiceName.WorkEmail,
                    ExternalServiceName.PersonalEmail,
                    ExternalServiceName.Email,
                ]),
        )
        .where((eb) => eb.or([eb('User.email', 'in', emails), eb('UserServices.serviceId', 'in', emails)]))
        .selectAll('User')
        .select([
            sql<string[]>`array_remove(array_agg(distinct "UserServices"."serviceId"), null)`.as('additionalEmails'),
        ])
        .groupBy('User.id')
        .execute();

    return users.reduce<Record<string, ExtractTypeFromGenerated<KyselyUser>>>((acc, userWithEmails) => {
        const { additionalEmails, ...user } = userWithEmails;

        acc[user.email] = user;

        emails.forEach((email) => {
            acc[email] = user;
        });

        return acc;
    }, {});
};

export const userCreationRequestsMethods = {
    create: async (
        data: CreateUserCreationRequest,
        sessionUserId: string,
    ): Promise<
        UserCreationRequest &
            BaseUserCreationRequest & { coordinators: User[] } & { lineManagers: User[] } & {
                curators: User[];
            } & { permissionServices: PermissionService[] }
    > => {
        const name = trimAndJoin([data.surname, data.firstName, data.middleName]);

        const isLoginUnique = await userMethods.isLoginUnique(data.login);

        if (isLoginUnique === false) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: tr('User with login {login} already exist', { login: data.login }),
            });
        }

        if ((data.type === 'internalEmployee' || data.type === 'existing') && !data.supervisorId) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: tr('Supervisor ID is required'),
            });
        }

        const supervisor = data.supervisorId
            ? await prisma.user.findUniqueOrThrow({ where: { id: data.supervisorId ?? undefined } })
            : undefined;

        data.date && data.date.setUTCHours(config.employmentUtcHour);

        const [phoneService, accountingService] = await Promise.all([
            prisma.externalService.findUnique({ where: { name: ExternalServiceName.Phone } }),
            prisma.externalService.findUnique({ where: { name: ExternalServiceName.AccountingSystem } }),
        ]);

        const servicesData: { serviceName: string; serviceId: string }[] = [];
        if (phoneService) {
            servicesData.push({ serviceName: phoneService.name, serviceId: data.phone });
        }
        if (accountingService && data.accountingId) {
            servicesData.push({ serviceName: accountingService.name, serviceId: data.accountingId });
        }

        const organizationUnit = await prisma.organizationUnit.findUnique({
            where: {
                id: data.organizationUnitId,
            },
        });

        const mainPosition = {
            organizationUnit: { connect: { id: data.organizationUnitId } },
            percentage: (data.percentage || 1) * percentageMultiply,
            main: true,
            role: data.title || undefined,
            status: PositionStatus.ACTIVE,
            workStartDate: data.date,
            unitId: data.unitId,
            intern: data.intern,
        };

        const createData: Prisma.UserCreationRequestUncheckedCreateInput = {
            type: data.type,
            name,
            creatorId: sessionUserId,
            email: data.email,
            login: data.login,
            organizationUnitId: data.organizationUnitId,
            groupId: data.groupId || undefined,
            supervisorLogin: supervisor?.login,
            supervisorId: data.supervisorId || undefined,
            title: data.title || undefined,
            corporateEmail: data.corporateEmail || undefined,
            osPreference: data.osPreference || undefined,
            createExternalAccount: Boolean(data.createExternalAccount),
            services: {
                toJSON: () => servicesData,
            },
            date: data.date || new Date(),
            comment: data.comment || undefined,
            workEmail: data.workEmail || undefined,
            personalEmail: data.personalEmail || undefined,
            attaches: data.attachIds?.length ? { connect: data.attachIds.map((id) => ({ id })) } : undefined,
            lineManagers: data.lineManagerIds?.length
                ? { connect: data.lineManagerIds?.map((id) => ({ id })) }
                : undefined,
            supplementalPositions: {
                create: [mainPosition],
            },
        };

        if (data.supplementalPositions?.length && data.type === 'existing') {
            createData.supplementalPositions = {
                create: [
                    mainPosition,
                    ...data.supplementalPositions.map(({ organizationUnitId, percentage, unitId, workStartDate }) => ({
                        organizationUnit: { connect: { id: organizationUnitId } },
                        percentage: percentage * percentageMultiply,
                        main: false,
                        role: data.title || undefined,
                        status: PositionStatus.ACTIVE,
                        workStartDate,
                        unitId,
                        intern: data.intern,
                    })),
                ],
            };
        }

        if (data.type === 'externalEmployee') {
            if (!organizationUnit?.external) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Cannot create external user in internal organization',
                });
            }

            createData.accessToInternalSystems = data.accessToInternalSystems;
        }

        if (data.type === 'internalEmployee') {
            if (organizationUnit?.external) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Cannot create internal user in external organization',
                });
            }

            const buddy = data.buddyId
                ? await prisma.user.findUniqueOrThrow({ where: { id: data.buddyId ?? undefined } })
                : undefined;

            const recruiter = data.recruiterId
                ? await prisma.user.findUniqueOrThrow({ where: { id: data.recruiterId ?? undefined } })
                : undefined;

            createData.supplementalPositions = {
                create: [
                    mainPosition,
                    ...(data.supplementalPositions?.map(
                        ({ organizationUnitId, percentage, unitId, workStartDate }) => ({
                            organizationUnit: { connect: { id: organizationUnitId } },
                            percentage: percentage * percentageMultiply,
                            main: false,
                            role: data.title || undefined,
                            status: PositionStatus.ACTIVE,
                            workStartDate,
                            unitId,
                        }),
                    ) || []),
                ],
            };
            createData.workMode = data.workMode || undefined;
            createData.workModeComment = data.workModeComment || undefined;
            createData.equipment = data.equipment || undefined;
            createData.extraEquipment = data.extraEquipment || undefined;
            createData.workSpace = data.workSpace || undefined;
            createData.buddyLogin = buddy?.login || undefined;
            createData.buddyId = buddy?.id || undefined;
            createData.coordinators = { connect: data.coordinatorIds?.map((id) => ({ id })) };

            createData.recruiterLogin = recruiter?.login || undefined;
            createData.recruiterId = recruiter?.id || undefined;
            createData.location = data.location || undefined;
            createData.creationCause = data.creationCause || undefined;
            createData.unitId = data.unitId || undefined;
            createData.personalEmail = data.personalEmail || undefined;
            createData.percentage = data.percentage ? data.percentage * percentageMultiply : undefined;
            createData.transferFromGroup = data.transferFromGroup;
        }

        if (data.type === 'externalFromMainOrgEmployee' || data.type === 'externalEmployee') {
            createData.permissionServices = { connect: data.permissionToServices?.map((id) => ({ id })) };
            createData.curators = { connect: data.curatorIds?.map((id) => ({ id })) };
            createData.reasonToGrantPermissionToServices = data.reason;
            createData.workEmail = data.workEmail;
        }

        const userCreationRequest = await prisma.userCreationRequest.create({
            data: createData,
            include: {
                group: true,
                organization: true,
                supervisor: true,
                buddy: true,
                coordinators: true,
                recruiter: true,
                creator: true,
                lineManagers: true,
                supplementalPositions: { include: { organizationUnit: true } },
                curators: true,
                permissionServices: true,
            },
        });

        if (data.type === 'existing') {
            await userCreationRequestsMethods.accept({ id: userCreationRequest.id });
        }

        if (userCreationRequest.status === UserCreationRequestStatus.Draft) {
            return userCreationRequest;
        }

        const { to } = await userMethods.getMailingList('createUserRequest', [data.organizationUnitId]);

        const requestLink = () => {
            if (data.type === 'externalEmployee') return pages.externalUserRequest(userCreationRequest.id);

            if (data.type === 'externalFromMainOrgEmployee') {
                return pages.externalUserFromMainOrgRequest(userCreationRequest.id);
            }
            return pages.internalUserRequest(userCreationRequest.id);
        };

        const mailText = userCreationMailText(name, requestLink());

        const subject = tr('New user request {userName}', { userName: name });

        sendMail({
            to,
            subject,
            text: mailText,
        });

        if (data.date && data.type === 'internalEmployee') {
            await sendNewCommerEmails({
                request: userCreationRequest,
                sessionUserId,
                method: ICalCalendarMethod.REQUEST,
            });
        }

        return userCreationRequest;
    },

    createDecreeRequest: async (data: UserDecreeSchema, sessionUserId: string) => {
        const currentUser = await userMethods.getById(data.userTargetId);

        const findActive = (id: string) =>
            currentUser.supplementalPositions.find((p) => p.organizationUnitId === id && p.status === 'ACTIVE');

        const createSupplemental = (item: {
            organizationUnitId: string;
            percentage: number;
            unitId: string | null;
            main: boolean;
            workStartDate: Date | null;
            status: PositionStatus;
        }): Prisma.SupplementalPositionCreateInput => {
            return {
                organizationUnit: { connect: { id: item.organizationUnitId } },
                percentage: item.percentage * percentageMultiply,
                main: item.main,
                role: data.title,
                unitId: item.unitId,
                workEndDate: data.type === 'toDecree' ? data.date : null,
                workStartDate: item.workStartDate,
                status: item.status,
            };
        };

        const status = data.type === 'toDecree' ? PositionStatus.DECREE : PositionStatus.ACTIVE;

        const supplementalPositions =
            data.supplementalPositions?.reduce<Prisma.SupplementalPositionCreateInput[]>((acum, item) => {
                const baseInput = {
                    organizationUnitId: item.organizationUnitId,
                    percentage: item.percentage,
                    unitId: item.unitId || null,
                    main: false,
                    status,
                };

                if (data.type === 'fromDecree') {
                    acum.push(
                        createSupplemental({
                            ...baseInput,
                            workStartDate: data.date,
                        }),
                    );
                } else {
                    const existed = findActive(item.organizationUnitId);

                    if (existed) {
                        acum.push(
                            createSupplemental({
                                ...baseInput,
                                workStartDate: existed.workStartDate,
                            }),
                        );
                    }
                }

                return acum;
            }, []) || [];

        const baseInput = {
            organizationUnitId: data.organizationUnitId,
            percentage: data.percentage || 1,
            unitId: data.unitId || null,
            main: true,
            status,
        };

        if (data.type === 'fromDecree') {
            supplementalPositions.push(
                createSupplemental({
                    ...baseInput,
                    workStartDate: data.date,
                }),
            );
        } else {
            const position = findActive(data.organizationUnitId);

            if (position) {
                supplementalPositions.push(
                    createSupplemental({
                        ...baseInput,
                        workStartDate: position.workStartDate,
                    }),
                );
            }
        }

        if (data.type === UserCreationRequestType.toDecree && data.firedOrganizationUnitId) {
            const positionToFire = findActive(data.organizationUnitId);

            if (positionToFire) {
                supplementalPositions.push(
                    createSupplemental({
                        organizationUnitId: data.firedOrganizationUnitId,
                        percentage: positionToFire.percentage,
                        unitId: positionToFire.unitId,
                        main: false,
                        status: PositionStatus.FIRED,
                        workStartDate: positionToFire.workStartDate,
                    }),
                );
            }
        }

        const buddy = data.buddyId
            ? await prisma.user.findUnique({ where: { id: data.buddyId ?? undefined } })
            : undefined;

        const supervisor = data.supervisorId
            ? await prisma.user.findUnique({ where: { id: data.supervisorId ?? undefined } })
            : undefined;

        const request = await prisma.userCreationRequest.create({
            data: {
                type: data.type,
                name: currentUser.name ?? '',
                userTargetId: data.userTargetId,
                creatorId: sessionUserId,
                email: data.email,
                login: data.login,
                organizationUnitId: data.organizationUnitId,
                percentage: (data.percentage ?? 1) * percentageMultiply,
                unitId: data.unitId,
                groupId: data.groupId || undefined,
                supervisorLogin: supervisor?.login || undefined,
                supervisorId: data.supervisorId || undefined,
                buddyLogin: buddy?.login || undefined,
                buddyId: buddy?.id || undefined,
                coordinators: { connect: data.coordinatorIds?.map((id) => ({ id })) },
                title: data.title || undefined,
                corporateEmail: data.corporateEmail || undefined,
                createExternalAccount: Boolean(data.createExternalAccount),
                disableAccount: data.type === 'toDecree' ? data.disableAccount : false,
                applicationForReturnOfEquipment: data.applicationForReturnOfEquipment || undefined,
                services: [],
                workMode: data.workMode,
                workModeComment: data.workModeComment,
                equipment: data.equipment,
                extraEquipment: data.extraEquipment,
                workSpace: data.workSpace,
                location: data.location,
                date: data.date,
                comment: data.comment || undefined,
                workEmail: data.workEmail || undefined,
                personalEmail: data.personalEmail || undefined,
                lineManagers: data.lineManagerIds?.length
                    ? { connect: data.lineManagerIds?.map((id) => ({ id })) }
                    : undefined,
                attaches: data.attachIds?.length ? { connect: data.attachIds.map((id) => ({ id })) } : undefined,
                supplementalPositions: {
                    create: supplementalPositions,
                },
            },
            include: {
                group: true,
                organization: true,
                supervisor: true,
                buddy: true,
                coordinators: true,
                recruiter: true,
                creator: true,
                lineManagers: true,
                supplementalPositions: { include: { organizationUnit: true } },
                curators: true,
                permissionServices: true,
                attaches: true,
            },
        });

        if (request.date) {
            await createJob('resolveDecree', {
                data: { userCreationRequestId: request.id },
                date: request.date,
            });
        }

        await sendDecreeEmails({
            request,
            sessionUserId,
            method: ICalCalendarMethod.REQUEST,
        });

        return request;
    },

    getById: async (id: string) => {
        // TODO: use getUserCreationRequestById query instead
        const request = await prisma.userCreationRequest.findUnique({
            where: { id },
            include: {
                attaches: { where: { deletedAt: null } },
                group: true,
                organization: true,
                supervisor: true,
                buddy: true,
                coordinators: true,
                recruiter: true,
                creator: true,
                lineManagers: true,
                supplementalPositions: { include: { organizationUnit: true } },
                curators: true,
                permissionServices: true,
            },
        });

        if (!request) {
            throw new TRPCError({ message: `No user creation request with id ${id}`, code: 'NOT_FOUND' });
        }

        return request;
    },

    getByExternalPersonId: async (externalPersonId: string) => {
        const request = await getUserCreationRequestByExternalPersonId(externalPersonId);

        if (!request) {
            throw new TRPCError({
                message: `No user creation request with externalPersonId ${externalPersonId}`,
                code: 'NOT_FOUND',
            });
        }

        return request;
    },

    getRequestForExternalEmployeeById: async (id: string): Promise<CreateUserCreationRequestExternalEmployee> => {
        const request = await prisma.userCreationRequest.findUnique({
            where: { id },
            include: {
                group: true,
                organization: true,
                supervisor: true,
                creator: true,
                lineManagers: true,
                supplementalPositions: { include: { organizationUnit: true } },
                curators: true,
                permissionServices: true,
                attaches: { where: { deletedAt: null } },
            },
        });

        if (!request) {
            throw new TRPCError({ message: `No user creation request with id ${id}`, code: 'NOT_FOUND' });
        }

        if (request.type !== 'externalEmployee') {
            throw new TRPCError({
                message: `Wrong request type ${request.type} instead of externalEmployee for request with id ${id}`,
                code: 'BAD_REQUEST',
            });
        }

        const {
            name,
            services,
            reasonToGrantPermissionToServices,
            group,
            organization,
            supervisor,
            lineManagers,
            supplementalPositions,
            permissionServices,
            curators,
            attaches,
            date,
            type,
            title,
            personalEmail,
            osPreference,
            accessToInternalSystems,
            unitId,
            corporateEmail,
            comment,
            workEmail,
            percentage,
            externalGroupId,
            ...restRequest
        } = request;

        const fullNameArray = name.split(' ');

        const phone = findService(ExternalServiceName.Phone, services as { serviceId: string; serviceName: string }[]);

        if (
            !date ||
            !title ||
            !personalEmail ||
            !osPreference ||
            !corporateEmail ||
            !phone ||
            accessToInternalSystems === null ||
            reasonToGrantPermissionToServices === null
        ) {
            throw new TRPCError({
                message: `Some data is missing for request with id ${id}`,
                code: 'BAD_REQUEST',
            });
        }

        return {
            ...restRequest,
            type: 'externalEmployee',
            title,
            date,
            firstName: fullNameArray[1],
            surname: fullNameArray[0],
            middleName: fullNameArray[2],
            phone,
            reason: reasonToGrantPermissionToServices,
            groupId: group?.id,
            organizationUnitId: organization.id,
            supervisorId: supervisor?.id,
            lineManagerIds: lineManagers.map(({ id }) => id),
            externalGroupId: externalGroupId || undefined,
            supplementalPositions: supplementalPositions.map(
                ({ organizationUnitId, unitId, percentage, workStartDate }) => ({
                    organizationUnitId,
                    unitId: unitId || undefined,
                    percentage,
                    workStartDate,
                }),
            ),
            permissionToServices: permissionServices.map(({ id }) => id),
            curatorIds: curators.map(({ id }) => id),
            attachIds: attaches.map(({ id }) => id) as [string, ...string[]],
            unitId: unitId || undefined,
            corporateEmail,
            comment: comment || undefined,
            workEmail: workEmail || undefined,
            percentage: percentage || undefined,
            accessToInternalSystems,
            personalEmail,
            osPreference,
            intern: !!supplementalPositions.find(({ intern }) => intern),
        };
    },

    getRequestForExternalFromMainEmployeeById: async (
        id: string,
    ): Promise<CreateUserCreationRequestexternalFromMainOrgEmployee> => {
        const request = await prisma.userCreationRequest.findUnique({
            where: { id },
            include: {
                group: true,
                organization: true,
                supervisor: true,
                creator: true,
                lineManagers: true,
                supplementalPositions: { include: { organizationUnit: true } },
                curators: true,
                permissionServices: true,
            },
        });

        if (!request) {
            throw new TRPCError({ message: `No user creation request with id ${id}`, code: 'NOT_FOUND' });
        }

        if (request.type !== 'externalFromMainOrgEmployee') {
            throw new TRPCError({
                message: `Wrong request type ${request.type} instead of externalFromMainOrgEmployee for request with id ${id}`,
                code: 'BAD_REQUEST',
            });
        }

        const {
            name,
            services,
            reasonToGrantPermissionToServices,
            group,
            organization,
            supervisor,
            lineManagers,
            supplementalPositions,
            permissionServices,
            curators,
            type,
            title,
            unitId,
            corporateEmail,
            comment,
            workEmail,
            percentage,
            personalEmail,
            osPreference,
            date,
            externalGroupId,
            ...restRequest
        } = request;

        const fullNameArray = name.split(' ');

        const phone = findService(ExternalServiceName.Phone, services as { serviceId: string; serviceName: string }[]);

        if (!title || !workEmail || !corporateEmail || !phone || reasonToGrantPermissionToServices === null) {
            throw new TRPCError({
                message: `Some data is missing for request with id ${id}`,
                code: 'BAD_REQUEST',
            });
        }

        return {
            ...restRequest,
            type: 'externalFromMainOrgEmployee',
            title,
            firstName: fullNameArray[1],
            surname: fullNameArray[0],
            middleName: fullNameArray[2],
            phone,
            reason: reasonToGrantPermissionToServices,
            externalGroupId: externalGroupId || undefined,
            groupId: group?.id,
            organizationUnitId: organization.id,
            supervisorId: supervisor?.id,
            lineManagerIds: lineManagers.map(({ id }) => id),
            supplementalPositions: supplementalPositions.map(
                ({ organizationUnitId, unitId, percentage, workStartDate }) => ({
                    organizationUnitId,
                    unitId: unitId || undefined,
                    percentage,
                    workStartDate,
                }),
            ),
            permissionToServices: permissionServices.map(({ id }) => id),
            curatorIds: curators.map(({ id }) => id),
            unitId: unitId || undefined,
            corporateEmail,
            comment: comment || undefined,
            workEmail,
            percentage: percentage || undefined,
            personalEmail: personalEmail || undefined,
            osPreference: osPreference || undefined,
            date: date || undefined,
            intern: !!supplementalPositions.find(({ intern }) => intern),
        };
    },

    edit: async (
        data: EditUserCreationRequest,
        requestBeforeUpdate: UserCreationRequestWithRelations,
        sessionUserId: string,
    ) => {
        const { id, data: editData } = data;

        const {
            groupId,
            supplementalPositions,
            organizationUnitId,
            firstName,
            surname,
            middleName,
            phone,
            lineManagerIds,
            ...restEditData
        } = editData;

        const name = trimAndJoin([surname, firstName, middleName]);

        if (requestBeforeUpdate.status === 'Denied') {
            throw new TRPCError({ code: 'FORBIDDEN', message: `Forbidden to edit denied request id: ${id}` });
        }

        editData.date && editData.date.setUTCHours(config.employmentUtcHour);

        const [phoneService, accountingService] = await Promise.all([
            prisma.externalService.findUnique({ where: { name: ExternalServiceName.Phone } }),
            prisma.externalService.findUnique({ where: { name: ExternalServiceName.AccountingSystem } }),
        ]);
        const servicesData: { serviceName: string; serviceId: string }[] = [];
        if (phoneService) {
            servicesData.push({ serviceName: phoneService.name, serviceId: phone });
        }
        if (accountingService && editData.accountingId) {
            servicesData.push({ serviceName: accountingService.name, serviceId: editData.accountingId });
        }

        const updateData: Prisma.UserCreationRequestUpdateInput = {
            name,
            email: editData.email,
            login: editData.login,
            title: editData.title || undefined,
            corporateEmail: editData.corporateEmail || undefined,
            osPreference: editData.osPreference || undefined,
            services: {
                toJSON: () => servicesData,
            },
            date: editData.date,
            comment: editData.comment || undefined,
            workEmail: editData.workEmail || undefined,
            personalEmail: editData.personalEmail || undefined,
        };

        updateData.name = name;

        if (groupId) {
            updateData.group = { connect: { id: groupId } };
        }

        if (lineManagerIds?.length) {
            updateData.lineManagers = { connect: lineManagerIds.map((id) => ({ id })) };
        }

        if (editData.supervisorId) {
            updateData.supervisor = { connect: { id: editData.supervisorId } };
        }

        updateData.organization = { connect: { id: organizationUnitId } };

        const createNewSupplementalPositions = [];

        const mainPosition = requestBeforeUpdate.supplementalPositions.find((position) => position.main);

        if (!mainPosition) {
            const newMainPosition = {
                organizationUnit: { connect: { id: editData.organizationUnitId } },
                percentage: (editData.percentage || 1) * percentageMultiply,
                main: true,
                role: editData.title,
                status: PositionStatus.ACTIVE,
                workStartDate: editData.date,
            };
            createNewSupplementalPositions.push(newMainPosition);
        }

        if (
            mainPosition &&
            (editData.title !== mainPosition.role ||
                mainPosition.organizationUnitId !== editData.organizationUnitId ||
                editData.date !== mainPosition.workStartDate ||
                editData.unitId !== mainPosition.unitId ||
                editData.intern !== mainPosition.intern ||
                (editData.percentage && editData.percentage * percentageMultiply !== mainPosition.percentage))
        ) {
            await prisma.supplementalPosition.update({
                where: { id: mainPosition.id },
                data: {
                    role: editData.title,
                    workStartDate: editData.date,
                    unitId: editData.unitId || null,
                    intern: editData.intern,
                    percentage: (editData.percentage || 1) * percentageMultiply,
                    organizationUnitId: editData.organizationUnitId,
                },
            });
        }

        const supplementalPositionBefore = requestBeforeUpdate.supplementalPositions.find((position) => !position.main);

        const newSupplemental = supplementalPositions ? supplementalPositions[0] : undefined;

        if (!supplementalPositionBefore && newSupplemental) {
            const newSupplementalPosition = {
                organizationUnit: { connect: { id: newSupplemental.organizationUnitId } },
                percentage: (newSupplemental.percentage || 1) * percentageMultiply,
                main: false,
                role: editData.title,
                status: PositionStatus.ACTIVE,
                workStartDate: newSupplemental.workStartDate,
                unitId: newSupplemental.unitId,
                intern: editData.intern,
            };
            createNewSupplementalPositions.push(newSupplementalPosition);
        }

        if (
            supplementalPositionBefore &&
            newSupplemental &&
            (editData.title !== supplementalPositionBefore.role ||
                newSupplemental.workStartDate !== supplementalPositionBefore.workStartDate ||
                newSupplemental.organizationUnitId !== supplementalPositionBefore.organizationUnitId ||
                newSupplemental.unitId !== supplementalPositionBefore.unitId ||
                newSupplemental.percentage * percentageMultiply !== supplementalPositionBefore.percentage)
        ) {
            await prisma.supplementalPosition.update({
                where: { id: supplementalPositionBefore.id },
                data: {
                    workStartDate: newSupplemental.workStartDate,
                    organizationUnitId: newSupplemental.organizationUnitId,
                    role: editData.title,
                    percentage: newSupplemental.percentage * percentageMultiply,
                    unitId: newSupplemental.unitId,
                    intern: editData.intern,
                },
            });
        }

        if (supplementalPositionBefore && !newSupplemental) {
            await prisma.supplementalPosition.delete({ where: { id: supplementalPositionBefore.id } });
        }

        if (restEditData.percentage) {
            updateData.percentage = restEditData.percentage * percentageMultiply;
        }

        if (editData.type === 'externalEmployee' || editData.type === 'externalFromMainOrgEmployee') {
            updateData.curators = { connect: editData.curatorIds.map((id) => ({ id })) };
            updateData.permissionServices = { connect: editData.permissionToServices.map((id) => ({ id })) };
            updateData.reasonToGrantPermissionToServices = editData.reason;
        }

        if (editData.type === 'externalEmployee') {
            updateData.attaches = { connect: editData.attachIds.map((id) => ({ id })) };
        }

        if (editData.type === 'internalEmployee') {
            updateData.workMode = editData.workMode;
            updateData.workModeComment = editData.workModeComment;
            updateData.equipment = editData.equipment;
            updateData.extraEquipment = editData.extraEquipment;
            updateData.workSpace = editData.workSpace;
            updateData.buddy = editData.buddyId ? { connect: { id: editData.buddyId } } : undefined;
            updateData.coordinators = { connect: editData.coordinatorIds?.map((id) => ({ id })) };

            updateData.recruiter = editData.recruiterId ? { connect: { id: editData.recruiterId } } : undefined;
            updateData.location = editData.location;
            updateData.creationCause = editData.creationCause;
            updateData.unitId = editData.unitId;
            updateData.personalEmail = editData.personalEmail;
            updateData.transferFromGroup = editData.transferFromGroup;
            updateData.percentage = editData.percentage ? editData.percentage * percentageMultiply : undefined;
        }

        if (createNewSupplementalPositions.length) {
            updateData.supplementalPositions = { create: createNewSupplementalPositions };
        }

        const updatedRequest = await prisma.userCreationRequest.update({
            where: { id },
            data: updateData,
            include: {
                group: true,
                organization: true,
                supervisor: true,
                buddy: true,
                coordinators: true,
                recruiter: true,
                creator: true,
                lineManagers: true,
                supplementalPositions: { include: { organizationUnit: true } },
                curators: true,
                permissionServices: true,
                attaches: { where: { deletedAt: null } },
            },
        });

        if (editData.date && requestBeforeUpdate.date !== editData.date && editData.type === 'internalEmployee') {
            // Не отправляем письма для запросов со статусом Draft
            if (requestBeforeUpdate.status !== UserCreationRequestStatus.Draft) {
                await sendNewCommerEmails({
                    request: requestBeforeUpdate,
                    sessionUserId,
                    method: ICalCalendarMethod.CANCEL,
                    newOrganizationIds: updatedRequest.supplementalPositions.map(
                        ({ organizationUnitId }) => organizationUnitId,
                    ),
                });
                await sendNewCommerEmails({
                    request: updatedRequest,
                    sessionUserId,
                    method: ICalCalendarMethod.REQUEST,
                });
            }

            if (requestBeforeUpdate.jobId) await jobUpdate(requestBeforeUpdate.jobId, { date: editData.date });
        }
        return updatedRequest;
    },

    editDecree: async (
        data: UserDecreeEditSchema,
        requestBeforeUpdate: UserCreationRequestWithRelations,
        sessionUserId: string,
    ) => {
        const { id, ...editData } = data;

        if (requestBeforeUpdate.status === 'Denied') {
            throw new TRPCError({ code: 'FORBIDDEN', message: `Forbidden to edit denied request id: ${id}` });
        }

        const currentUser = await userMethods.getById(data.userTargetId);

        const status = data.type === UserCreationRequestType.toDecree ? PositionStatus.DECREE : PositionStatus.ACTIVE;

        editData.date && editData.date.setUTCHours(config.employmentUtcHour);

        const supplementalPositionsToDisconnect = requestBeforeUpdate.supplementalPositions.reduce<{ id: string }[]>(
            (acum, item) => {
                const isInFired =
                    editData.type === UserCreationRequestType.toDecree &&
                    editData.firedOrganizationUnitId &&
                    item.organizationUnitId === editData.firedOrganizationUnitId;
                const isInMain = editData.organizationUnitId === item.organizationUnitId;
                const isInSupplemental = editData.supplementalPositions?.find(
                    (p) => p.organizationUnitId === item.organizationUnitId,
                );

                if (!isInFired && !isInMain && !isInSupplemental) {
                    acum.push({
                        id: item.id,
                    });
                }
                return acum;
            },
            [],
        );

        const supplementalPositionsToCreate: Prisma.SupplementalPositionCreateInput[] = [];

        const updateData: Prisma.UserCreationRequestUpdateInput = {
            title: editData.title || undefined,
            date: editData.date,
            comment: editData.comment || undefined,
            workMode: editData.workMode,
            workModeComment: editData.workModeComment,
            equipment: editData.equipment,
            extraEquipment: editData.extraEquipment,
            workSpace: editData.workSpace,
            buddy: editData.buddyId ? { connect: { id: editData.buddyId } } : undefined,
            coordinators: { connect: editData.coordinatorIds?.map((id) => ({ id })) },
            disableAccount: editData.type === 'toDecree' ? editData.disableAccount : false,
            location: editData.location,
            unitId: editData.unitId,
            supplementalPositions: {
                disconnect: supplementalPositionsToDisconnect,
                create: supplementalPositionsToCreate,
            },
        };

        if (editData.groupId) {
            updateData.group = { connect: { id: editData.groupId } };
        }

        if (editData.lineManagerIds?.length) {
            updateData.lineManagers = { connect: editData.lineManagerIds.map((id) => ({ id })) };
        }

        if (editData.supervisorId) {
            updateData.supervisor = { connect: { id: editData.supervisorId } };
        }

        if (editData.percentage) {
            updateData.percentage = editData.percentage * percentageMultiply;
        }

        if (editData.organizationUnitId !== requestBeforeUpdate.organizationUnitId) {
            updateData.organization = {
                connect: {
                    id: editData.organizationUnitId,
                },
            };
        }

        const supplementalPositionToUpdate: {
            id: string;
            status: PositionStatus;
            percentage?: number;
            unitId?: string | null;
            main?: boolean;
            workEndDate: Date | null;
            workStartDate: Date | null;
        }[] = [];

        const findPrevRequestPosition = (id: string) =>
            requestBeforeUpdate.supplementalPositions.find((p) => p.organizationUnitId === id);

        const findUserPosition = (id: string) =>
            currentUser.supplementalPositions.find((p) => p.organizationUnitId === id);

        const oldMainInRequest = findPrevRequestPosition(editData.organizationUnitId);

        const baseMainInput = {
            percentage: (editData.percentage || 1) * percentageMultiply,
            unitId: editData.unitId,
            status,
            main: true,
        };

        if (data.type === 'toDecree') {
            const oldMainUserPosition = findUserPosition(editData.organizationUnitId);

            if (oldMainUserPosition && oldMainUserPosition.status === 'ACTIVE') {
                const dateInput = {
                    workEndDate: data.date || null,
                    workStartDate: oldMainUserPosition.workStartDate,
                };
                if (oldMainInRequest) {
                    supplementalPositionToUpdate.push({
                        id: oldMainInRequest.id,
                        ...dateInput,
                        ...baseMainInput,
                    });
                } else {
                    supplementalPositionsToCreate.push({
                        organizationUnit: { connect: { id: editData.organizationUnitId } },
                        ...dateInput,
                        ...baseMainInput,
                    });
                }
            }
        } else {
            const dateInput = {
                workEndDate: null,
                workStartDate: data.date,
            };

            if (oldMainInRequest) {
                supplementalPositionToUpdate.push({
                    id: oldMainInRequest.id,
                    ...dateInput,
                    ...baseMainInput,
                });
            } else {
                supplementalPositionsToCreate.push({
                    organizationUnit: { connect: { id: editData.organizationUnitId } },
                    ...dateInput,
                    ...baseMainInput,
                });
            }
        }

        editData.supplementalPositions?.forEach((position) => {
            const baseInput = {
                percentage: (position.percentage || 1) * percentageMultiply,
                unitId: position.unitId,
                status,
                main: false,
            };

            const oldPositionInRequest = findPrevRequestPosition(position.organizationUnitId);

            if (data.type === 'toDecree') {
                const oldUserPosition = findUserPosition(position.organizationUnitId);

                if (oldUserPosition && oldUserPosition.status === 'ACTIVE') {
                    const dateInput = {
                        workEndDate: data.date,
                        workStartDate: oldUserPosition.workStartDate,
                    };

                    if (oldPositionInRequest) {
                        supplementalPositionToUpdate.push({
                            id: oldPositionInRequest.id,
                            ...dateInput,
                            ...baseInput,
                        });
                    } else {
                        supplementalPositionsToCreate.push({
                            organizationUnit: { connect: { id: position.organizationUnitId } },
                            ...dateInput,
                            ...baseInput,
                        });
                    }
                }
            } else {
                const dateInput = {
                    workEndDate: null,
                    workStartDate: data.date,
                };

                if (oldPositionInRequest) {
                    supplementalPositionToUpdate.push({
                        id: oldPositionInRequest.id,
                        ...dateInput,
                        ...baseInput,
                    });
                } else {
                    supplementalPositionsToCreate.push({
                        organizationUnit: { connect: { id: position.organizationUnitId } },
                        ...dateInput,
                        ...baseInput,
                    });
                }
            }
        });

        if (editData.type === 'toDecree' && editData.firedOrganizationUnitId) {
            const oldFired = findPrevRequestPosition(editData.firedOrganizationUnitId);
            const userPositionToFired = findUserPosition(editData.firedOrganizationUnitId);

            if (userPositionToFired) {
                const baseFiredInput = {
                    percentage: userPositionToFired.percentage,
                    unitId: userPositionToFired.unitId,
                    status: PositionStatus.FIRED,
                    main: false,
                    workStartDate: userPositionToFired.workStartDate,
                    workEndDate: data.date,
                };

                if (oldFired) {
                    supplementalPositionToUpdate.push({
                        id: oldFired.id,
                        ...baseFiredInput,
                    });
                } else if (userPositionToFired) {
                    supplementalPositionsToCreate.push({
                        organizationUnit: { connect: { id: editData.firedOrganizationUnitId } },
                        ...baseFiredInput,
                    });
                }
            }
        }

        await prisma.$transaction(
            supplementalPositionToUpdate.map(({ id, ...data }) =>
                prisma.supplementalPosition.update({
                    where: {
                        id,
                    },
                    data,
                }),
            ),
        );

        const updatedRequest = await prisma.userCreationRequest.update({
            where: { id },
            data: updateData,
            include: {
                group: true,
                organization: true,
                supervisor: true,
                buddy: true,
                coordinators: true,
                recruiter: true,
                creator: true,
                lineManagers: true,
                supplementalPositions: { include: { organizationUnit: true } },
                curators: true,
                permissionServices: true,
                attaches: { where: { deletedAt: null } },
            },
        });

        if (editData.date && requestBeforeUpdate.date !== editData.date) {
            await sendDecreeEmails({
                request: requestBeforeUpdate,
                sessionUserId,
                method: ICalCalendarMethod.CANCEL,
                newOrganizationIds: updatedRequest.supplementalPositions.map(
                    ({ organizationUnitId }) => organizationUnitId,
                ),
            });

            await sendDecreeEmails({
                request: updatedRequest,
                sessionUserId,
                method: ICalCalendarMethod.REQUEST,
            });

            if (requestBeforeUpdate.jobId) await jobUpdate(requestBeforeUpdate.jobId, { date: editData.date });
        }
        return updatedRequest;
    },

    decline: async ({ id, comment }: HandleUserCreationRequest): Promise<UserCreationRequest> => {
        return prisma.userCreationRequest.update({
            where: { id },
            data: { status: 'Denied', comment },
        });
    },

    accept: async ({ id, comment }: HandleUserCreationRequest): Promise<CompleteUserCreationRequest> => {
        const userCreationRequest = await prisma.userCreationRequest.findUnique({ where: { id } });

        if (!userCreationRequest) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'User creation request not found' });
        }

        let user = null;

        const isDecreeRequest = userCreationRequest.type === 'toDecree' || userCreationRequest.type === 'fromDecree';

        if (!isDecreeRequest) {
            try {
                user = await userMethods.getByLogin(userCreationRequest.login);
            } catch (error) {
                /* empty */
            }

            if (user) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'User already exists' });
            }
        }

        const acceptedRequest = await prisma.userCreationRequest.update({
            where: { id },
            data: { status: 'Approved', comment },
            include: { supervisor: true, organization: true, group: true },
        });

        if (userCreationRequest.date) {
            if (isDecreeRequest) {
                await createJob('resolveDecree', {
                    data: { userCreationRequestId: userCreationRequest.id },
                    date: userCreationRequest.date,
                });
            } else {
                await createJob('createProfile', {
                    data: { userCreationRequestId: userCreationRequest.id },
                    date: userCreationRequest.date,
                });
            }
        }

        return acceptedRequest as CompleteUserCreationRequest;
    },

    getList: async (data: GetUserCreationRequestList): Promise<CompleteUserCreationRequest[]> => {
        const where: Prisma.UserCreationRequestWhereInput = {};

        if (data.type) {
            where.type = { in: data.type };
        }

        if (data.status !== undefined) {
            where.status = data.status;
        }

        if (data.search) {
            where.name = { contains: data.search, mode: 'insensitive' };
        }

        let orderBy: Prisma.UserCreationRequestOrderByWithRelationAndSearchRelevanceInput[] = [];

        if (data.orderBy?.name) {
            orderBy = [{ name: data.orderBy?.name }];
        }

        if (data.orderBy?.date) {
            orderBy = [{ date: data.orderBy?.date }];
        }

        if (data.orderBy?.createdAt) {
            orderBy = [{ createdAt: data.orderBy?.createdAt }];
        }

        const requests = await prisma.userCreationRequest.findMany({
            where,
            include: {
                group: true,
                organization: true,
                supervisor: true,
                buddy: true,
                coordinator: true,
                coordinators: true,
                lineManagers: true,
                recruiter: true,
                creator: true,
                supplementalPositions: { include: { organizationUnit: true } },
            },
            orderBy,
        });

        return requests as CompleteUserCreationRequest[];
    },

    cancel: async ({ id, comment }: HandleUserCreationRequest, sessionUserId: string) => {
        const canceledRequest = await prisma.userCreationRequest.update({
            where: { id },
            data: { status: 'Canceled', cancelComment: comment },
            include: {
                group: true,
                organization: true,
                supervisor: true,
                buddy: true,
                coordinators: true,
                recruiter: true,
                creator: true,
                lineManagers: true,
                supplementalPositions: { include: { organizationUnit: true } },
                curators: true,
                permissionServices: true,
                attaches: true,
            },
        });
        if (canceledRequest.jobId) await jobDelete(canceledRequest.jobId);

        if (canceledRequest.type === 'internalEmployee') {
            await sendNewCommerEmails({
                request: canceledRequest,
                sessionUserId,
                method: ICalCalendarMethod.CANCEL,
            });
        }

        if (canceledRequest.type === 'toDecree' || canceledRequest.type === 'fromDecree') {
            await sendDecreeEmails({
                request: canceledRequest,
                sessionUserId,
                method: ICalCalendarMethod.CANCEL,
            });
        }

        return canceledRequest;
    },
    getRequestForInternalEmployeeById: async (id: string): Promise<CreateUserCreationRequestInternalEmployee> => {
        const request = await prisma.userCreationRequest.findUnique({
            where: { id },
            include: {
                coordinators: true,
                lineManagers: true,
                supplementalPositions: { include: { organizationUnit: true } },
            },
        });
        if (!request) {
            throw new TRPCError({ message: `No user creation request with id ${id}`, code: 'NOT_FOUND' });
        }

        if (request.type !== 'internalEmployee') {
            throw new TRPCError({
                message: `Wrong request type ${request.type} instead of InternalEmployee for request with id ${id}`,
                code: 'BAD_REQUEST',
            });
        }

        const {
            services,
            name,
            type,
            title,
            recruiterId,
            buddyId,
            supervisorId,
            date,
            percentage,
            workMode,
            equipment,
            location,
            creationCause,
            groupId,
            corporateEmail,
            comment,
            workModeComment,
            extraEquipment,
            workSpace,
            personalEmail,
            workEmail,
            unitId,
            osPreference,
            supplementalPositions,
            coordinators,
            lineManagers,
            transferFromGroup,
            externalGroupId,
            ...restRequest
        } = request;

        const fullNameArray = name.split(' ');

        const phone = findService(ExternalServiceName.Phone, services as { serviceId: string; serviceName: string }[]);

        if (!date || !title || !phone || !supervisorId || !location || !creationCause) {
            throw new TRPCError({
                message: `Some data is missing for request with id ${id}`,
                code: 'BAD_REQUEST',
            });
        }

        if (!phone) {
            throw new TRPCError({ message: 'No phone creation request', code: 'NOT_FOUND' });
        }

        return {
            ...restRequest,
            type: 'internalEmployee',
            title,
            phone,
            date,
            supervisorId,
            buddyId: buddyId || undefined,
            recruiterId: recruiterId || undefined,
            percentage: percentage ? percentage / percentageMultiply : undefined,
            workMode: workMode || '',
            equipment: equipment || '',
            location,
            creationCause,
            externalGroupId: externalGroupId || undefined,
            coordinatorIds: coordinators.map(({ id }) => id) || undefined,
            lineManagerIds: lineManagers.map(({ id }) => id),
            groupId: groupId || undefined,
            corporateEmail: corporateEmail || undefined,
            comment: comment || undefined,
            workModeComment: workModeComment || undefined,
            extraEquipment: extraEquipment || undefined,
            workSpace: workSpace || undefined,
            personalEmail: personalEmail || undefined,
            workEmail: workEmail || undefined,
            supplementalPositions: supplementalPositions
                .filter((position) => !position.main)
                .map(({ organizationUnitId, unitId, percentage, workStartDate }) => ({
                    organizationUnitId,
                    unitId: unitId || undefined,
                    percentage: percentage / percentageMultiply,
                    workStartDate,
                })),
            osPreference: osPreference || undefined,
            unitId: unitId || undefined,
            surname: fullNameArray[0],
            firstName: fullNameArray[1],
            middleName: fullNameArray[2],
            intern: !!supplementalPositions.find(({ intern }) => intern),
            transferFromGroup: transferFromGroup || undefined,
        };
    },

    getDecreeRequestById: async (id: string): Promise<UserDecreeRequest> => {
        const request = await prisma.userCreationRequest.findUnique({
            where: { id },
            include: {
                coordinators: true,
                lineManagers: true,
                supplementalPositions: { include: { organizationUnit: true } },
                userTarget: {
                    include: {
                        services: true,
                    },
                },
            },
        });

        if (!request) {
            throw new TRPCError({ message: `No user creation request with id ${id}`, code: 'NOT_FOUND' });
        }

        const {
            services,
            name,
            type,
            title,
            recruiterId,
            buddyId,
            supervisorId,
            date,
            percentage,
            workMode,
            equipment,
            location,
            groupId,
            corporateEmail,
            comment,
            workModeComment,
            extraEquipment,
            workSpace,
            personalEmail,
            workEmail,
            unitId,
            osPreference,
            supplementalPositions,
            coordinators,
            lineManagers,
            userTargetId,
            userTarget,
            ...restRequest
        } = request;

        if (type !== UserCreationRequestType.toDecree && type !== UserCreationRequestType.fromDecree) {
            throw new TRPCError({
                message: `Wrong request type ${request.type} instead of fromDecree or toDecree for request with id ${id}`,
                code: 'BAD_REQUEST',
            });
        }

        const fullNameArray = name.split(' ');

        const s = userTarget?.services as { serviceId: string; serviceName: string }[];

        const phone = findService(ExternalServiceName.Phone, s);

        if (
            !userTarget ||
            !userTargetId ||
            !date ||
            !title ||
            !phone ||
            !supervisorId ||
            !workMode ||
            !equipment ||
            !location
        ) {
            throw new TRPCError({
                message: `Some data is missing for request with id ${id}`,
                code: 'BAD_REQUEST',
            });
        }

        return {
            ...restRequest,
            userTargetId,
            type,
            title,
            phone,
            date,
            supervisorId,
            services: s,
            buddyId,
            recruiterId,
            percentage: percentage ? percentage / percentageMultiply : null,
            workMode,
            equipment,
            location,
            coordinatorIds: coordinators.map(({ id }) => id) || undefined,
            lineManagerIds: lineManagers.map(({ id }) => id),
            groupId,
            corporateEmail,
            comment,
            workModeComment,
            extraEquipment,
            workSpace,
            personalEmail,
            workEmail,
            supplementalPositions: supplementalPositions.map(({ percentage, ...rest }) => ({
                ...rest,
                percentage: percentage / percentageMultiply,
            })),
            osPreference,
            unitId,
            name,
            surname: fullNameArray[0],
            firstName: fullNameArray[1],
            middleName: fullNameArray[2],
        };
    },

    transferInternToStaff: async (data: TransferInternToStaff, sessionUserId: string) => {
        const user = await userMethods.getById(data.userId);

        if (!user) {
            throw new TRPCError({ message: `No user with id ${data.userId}`, code: 'NOT_FOUND' });
        }

        await serviceMethods.updateUserServicesInRequest({
            services: user.services,
            userId: user.id,
            phone: data.phone,
            workEmail: data.workEmail,
            personalEmail: data.personalEmail,
        });

        const oldPositions = user.supplementalPositions.filter((s) => s.status === 'ACTIVE' && s.intern);

        if (!oldPositions.length) {
            throw new TRPCError({
                message: `User with id ${data.userId} have no intern positions`,
                code: 'BAD_REQUEST',
            });
        }

        const request = await db
            .insertInto('UserCreationRequest')
            .values({
                type: UserCreationRequestType.transferInternToStaff,
                userTargetId: data.userId,
                email: data.email,
                login: data.login,
                name: user.name ?? trimAndJoin([data.surname, data.firstName, data.middleName]),
                creatorId: sessionUserId,
                organizationUnitId: data.organizationUnitId,
                percentage: (data.percentage ?? 1) * percentageMultiply,
                unitId: data.unitId,
                groupId: data.groupId || undefined,
                supervisorId: data.supervisorId,
                title: data.title || undefined,
                corporateEmail: data.corporateEmail || undefined,
                createExternalAccount: false,
                workMode: data.workMode,
                workModeComment: data.workModeComment,
                workSpace: data.workSpace,
                location: data.location,
                date: data.date,
                comment: data.comment || undefined,
                workEmail: data.workEmail || undefined,
                personalEmail: data.personalEmail || undefined,
                internshipOrganizationId: data.internshipOrganizationId,
                internshipOrganizationGroup: data.internshipOrganizationGroup,
                internshipRole: data.internshipRole,
                internshipSupervisor: data.internshipSupervisor,
                applicationForReturnOfEquipment: data.applicationForReturnOfEquipment,
                ...(data.devices && data.devices.length && { devices: { toJSON: () => data.devices } }),
                ...(data.testingDevices && { testingDevices: { toJSON: () => data.testingDevices } }),
                services: [],
            })
            .returningAll()
            .$narrowType<{
                services: JsonValue;
                testingDevices: JsonValue;
                devices: JsonValue;
            }>()
            .executeTakeFirstOrThrow();

        await sendTransferInternToStaffEmail(request, ICalCalendarMethod.REQUEST, sessionUserId);

        const newPositionValues = [
            {
                organizationUnitId: data.organizationUnitId,
                workStartDate: data.date,
                percentage: data.percentage ? data.percentage * percentageMultiply : 100,
                unitId: data.unitId,
                main: true,
                userCreationRequestId: request.id,
            },
        ];

        if (data.supplementalPositions?.length) {
            newPositionValues.push(
                ...data.supplementalPositions.map((s) => ({
                    organizationUnitId: s.organizationUnitId,
                    workStartDate: data.date,
                    percentage: s.percentage * percentageMultiply,
                    unitId: s.unitId,
                    main: false,
                    userCreationRequestId: request.id,
                })),
            );
        }

        const supplementalPositions = await db
            .insertInto('SupplementalPosition')
            .values(newPositionValues)
            .returningAll()
            .returning((eb) => [
                'SupplementalPosition.id',
                jsonObjectFrom(
                    eb
                        .selectFrom('OrganizationUnit')
                        .select([
                            'OrganizationUnit.country as country',
                            'OrganizationUnit.description as description',
                            'OrganizationUnit.external as external',
                            'OrganizationUnit.id as id',
                            'OrganizationUnit.name as name',
                        ])
                        .whereRef('OrganizationUnit.id', '=', 'SupplementalPosition.organizationUnitId'),
                ).as('organizationUnit'),
            ])
            .execute();

        if (data.attachIds?.length) {
            await db
                .updateTable('Attach')
                .where('id', 'in', data.attachIds)
                .set({ userCreationRequestId: request.id })
                .execute();
        }

        if (data.lineManagerIds?.length) {
            await db
                .insertInto('_userLineManagers')
                .values(data.lineManagerIds.map((id) => ({ A: id, B: request.id })))
                .execute();
        }

        await db
            .updateTable('SupplementalPosition')
            .where(
                'id',
                'in',
                oldPositions.map(({ id }) => id),
            )
            .set({ workEndDate: data.date })
            .execute();

        Promise.all(
            oldPositions.map(async (s) => {
                await createJob('scheduledFiringFromSupplementalPosition', {
                    date: data.date || undefined,
                    data: { supplementalPositionId: s.id, userId: data.userId },
                });
            }),
        );

        if (request.date) {
            await createJob('editUserOnScheduledRequest', {
                data: { userCreationRequestId: request.id },
                date: request.date,
            });
        }

        return {
            id: request.id,
            userId: request.userTargetId || undefined,
            groupId: request.groupId || undefined,
            date: request.date || undefined,
            supervisorId: request.supervisorId || undefined,
            comment: request.comment || undefined,
            supplementalPositions: supplementalPositions.map((s) => ({
                ...s,
                unitId: s.unitId || undefined,
                percentage: s.percentage / percentageMultiply,
            })),
            workMode: request.workMode || undefined,
            workModeComment: request.workModeComment || undefined,
            workSpace: request.workSpace || undefined,
            location: request.location || undefined,
            internshipOrganizationId: request.internshipOrganizationId || undefined,
            internshipOrganizationGroup: request.internshipOrganizationGroup || undefined,
            internshipRole: request.internshipRole || undefined,
            internshipSupervisor: request.internshipSupervisor || undefined,
            applicationForReturnOfEquipment: request.applicationForReturnOfEquipment || undefined,
            testingDevices: request.testingDevices as Record<'name' | 'id', string>[],
            devices: request.devices as Record<'name' | 'id', string>[],
            lineManagerIds: data.lineManagerIds,
            attachIds: data.attachIds,
        };
    },

    getTransferInternToStaffById: async (id: string): Promise<TransferInternToStaff> => {
        const request = await db
            .selectFrom('UserCreationRequest')
            .where('id', '=', id)
            .selectAll()
            .select((eb) => [
                'UserCreationRequest.id',
                jsonArrayFrom(
                    eb
                        .selectFrom('SupplementalPosition as s')
                        .select([
                            's.id',
                            's.workStartDate',
                            's.main',
                            's.organizationUnitId',
                            's.unitId',
                            's.percentage',
                        ])
                        .select((eb) => [
                            's.id',
                            jsonObjectFrom(
                                eb
                                    .selectFrom('OrganizationUnit')
                                    .select([
                                        'OrganizationUnit.country as country',
                                        'OrganizationUnit.description as description',
                                        'OrganizationUnit.external as external',
                                        'OrganizationUnit.id as id',
                                        'OrganizationUnit.name as name',
                                    ])
                                    .whereRef('OrganizationUnit.id', '=', 's.organizationUnitId'),
                            ).as('organizationUnit'),
                        ])
                        .whereRef('s.userCreationRequestId', '=', 'UserCreationRequest.id'),
                ).as('supplementalPositions'),
            ])
            .select((eb) => [
                'UserCreationRequest.id',
                jsonArrayFrom(
                    eb.selectFrom('_userLineManagers').select('A').whereRef('B', '=', 'UserCreationRequest.id'),
                ).as('lineManagerIds'),
            ])
            .select((eb) => [
                'UserCreationRequest.id',
                jsonArrayFrom(
                    eb
                        .selectFrom('Attach as a')
                        .select('a.id')
                        .whereRef('a.userCreationRequestId', '=', 'UserCreationRequest.id'),
                ).as('attachIds'),
            ])
            .select((eb) => [
                'UserCreationRequest.id',
                jsonObjectFrom(
                    eb
                        .selectFrom('Group as g')
                        .select(['g.id', 'g.name'])
                        .whereRef('g.id', '=', 'UserCreationRequest.groupId'),
                ).as('group'),
            ])
            .executeTakeFirst();

        if (!request) {
            throw new TRPCError({ message: `No transfer intern to staff request with id ${id}`, code: 'NOT_FOUND' });
        }

        if (!request.userTargetId) {
            throw new TRPCError({
                message: `No user in transfer intern to staff request with id ${id}`,
                code: 'BAD_REQUEST',
            });
        }

        if (request.type !== UserCreationRequestType.transferInternToStaff) {
            throw new TRPCError({
                message: `Request with id ${id} is not transfer intern to staff type`,
                code: 'BAD_REQUEST',
            });
        }

        const fullNameArray = request.name.split(' ');

        const mainOrganization = request.supplementalPositions.find((s) => s.main);

        const services = await serviceMethods.getUserServices(request.userTargetId);

        const phone = findService(ExternalServiceName.Phone, services);

        return {
            type: request.type,
            surname: fullNameArray[0],
            firstName: fullNameArray[1],
            middleName: fullNameArray[2],
            email: request.email,
            supervisorId: request.supervisorId || '',
            organizationUnitId: mainOrganization?.organizationUnitId || '',
            percentage: (mainOrganization?.percentage || 100) / percentageMultiply,
            unitId: mainOrganization?.unitId || undefined,
            login: request.login,
            applicationForReturnOfEquipment: request.applicationForReturnOfEquipment || undefined,
            date: request.date,
            title: request.title || '',
            workMode: request.workMode || '',
            phone: phone || '',
            workEmail: request.workEmail || '',
            personalEmail: request.personalEmail || '',
            location: request.location || '',
            internshipOrganizationId: request.internshipOrganizationId || '',
            userId: request.userTargetId,
            groupId: request.groupId || undefined,
            comment: request.comment || undefined,
            supplementalPositions:
                request.supplementalPositions
                    .filter(({ main }) => !main)
                    .map(({ organizationUnitId, percentage, unitId, main }) => ({
                        organizationUnitId,
                        percentage: percentage / percentageMultiply,
                        unitId: unitId || undefined,
                        main,
                    })) || [],
            workSpace: request.workSpace || '',
            lineManagerIds: request.lineManagerIds.map(({ A }) => A),
            internshipOrganizationGroup: request.internshipOrganizationGroup || undefined,
            internshipRole: request.internshipRole || undefined,
            internshipSupervisor: request.internshipSupervisor || undefined,
            devices: request.devices as Record<'name' | 'id', string>[],
            testingDevices: request.testingDevices as Record<'name' | 'id', string>[],
            attachIds: request.attachIds.map(({ id }) => id),
        };
    },

    editTransferInternToStaff: async (data: EditTransferInternToStaff, sessionUserId: string) => {
        const { id, ...restData } = data;

        const requestBefore = await db
            .selectFrom('UserCreationRequest')
            .selectAll()
            .select((eb) => [
                'UserCreationRequest.id',
                jsonArrayFrom(
                    eb.selectFrom('_userLineManagers').select('A as id').whereRef('B', '=', 'UserCreationRequest.id'),
                ).as('lineManagerIds'),
            ])
            .where('id', '=', id)
            .$narrowType<{
                services: JsonValue;
                testingDevices: JsonValue;
                devices: JsonValue;
            }>()
            .executeTakeFirstOrThrow();

        const supplementalPositionsBefore = await db
            .selectFrom('SupplementalPosition')
            .selectAll()
            .where('userCreationRequestId', '=', id)
            .execute();

        const mainPositionBefore = supplementalPositionsBefore.find((s) => s.main);

        const createPositionValues = [];

        if (!mainPositionBefore) {
            createPositionValues.push({
                organizationUnitId: restData.organizationUnitId,
                workStartDate: restData.date,
                percentage: restData.percentage ? restData.percentage * percentageMultiply : 100,
                unitId: restData.unitId,
                main: true,
                userCreationRequestId: id,
            });
        }

        if (
            mainPositionBefore &&
            (mainPositionBefore.organizationUnitId !== restData.organizationUnitId ||
                restData.date?.toDateString() !== mainPositionBefore.workStartDate?.toDateString() ||
                restData.percentage !== mainPositionBefore.percentage / percentageMultiply ||
                restData.unitId !== mainPositionBefore.unitId)
        ) {
            await db
                .updateTable('SupplementalPosition')
                .where('id', '=', mainPositionBefore.id)
                .set({
                    organizationUnitId: restData.organizationUnitId,
                    workStartDate: restData.date,
                    percentage: restData.percentage ? restData.percentage * percentageMultiply : 100,
                    unitId: restData.unitId,
                    main: true,
                })
                .execute();
        }

        const supplementalPositionBefore = supplementalPositionsBefore.find((s) => !s.main);

        const supplementalPosition = restData.supplementalPositions ? restData.supplementalPositions[0] : undefined;

        if (!supplementalPositionBefore && supplementalPosition) {
            createPositionValues.push({
                organizationUnitId: supplementalPosition.organizationUnitId,
                workStartDate: restData.date,
                percentage: supplementalPosition.percentage
                    ? supplementalPosition.percentage * percentageMultiply
                    : 100,
                unitId: supplementalPosition.unitId,
                userCreationRequestId: id,
            });
        }

        if (createPositionValues.length) {
            await db.insertInto('SupplementalPosition').values(createPositionValues).execute();
        }

        if (supplementalPositionBefore && !supplementalPosition) {
            await db.deleteFrom('SupplementalPosition').where('id', '=', supplementalPositionBefore.id).execute();
        }

        if (
            supplementalPositionBefore &&
            supplementalPosition &&
            (supplementalPositionBefore.organizationUnitId !== supplementalPosition.organizationUnitId ||
                restData.date?.toDateString() !== supplementalPositionBefore.workStartDate?.toDateString() ||
                supplementalPosition.percentage !== supplementalPositionBefore.percentage / percentageMultiply ||
                supplementalPosition.unitId !== supplementalPositionBefore.unitId)
        ) {
            await db
                .updateTable('SupplementalPosition')
                .where('id', '=', supplementalPositionBefore.id)
                .set({
                    organizationUnitId: supplementalPosition.organizationUnitId,
                    workStartDate: restData.date,
                    percentage: supplementalPosition.percentage
                        ? supplementalPosition.percentage * percentageMultiply
                        : 100,
                    unitId: supplementalPosition.unitId,
                })
                .execute();
        }

        if (restData.attachIds?.length) {
            await db
                .updateTable('Attach')
                .where('id', 'in', restData.attachIds)
                .set({ userCreationRequestId: id })
                .execute();
        }

        if (requestBefore.lineManagerIds.length) {
            await db
                .deleteFrom('_userLineManagers')
                .where('B', '=', requestBefore.id)
                .where(
                    'A',
                    'in',
                    requestBefore.lineManagerIds.map(({ id }) => id),
                )
                .execute();
        }

        if (restData.lineManagerIds?.length) {
            await db
                .insertInto('_userLineManagers')
                .values(restData.lineManagerIds.map((id) => ({ A: id, B: requestBefore.id })))
                .execute();
        }

        if (requestBefore.date?.toDateString() !== restData.date?.toDateString()) {
            const oldPositions = await db
                .selectFrom('SupplementalPosition')
                .selectAll()
                .where('userId', '=', requestBefore.userTargetId)
                .where('status', '=', 'ACTIVE')
                .where('workEndDate', 'is not', null)
                .execute();

            oldPositions.length &&
                (await Promise.all([
                    db
                        .updateTable('SupplementalPosition')
                        .where(
                            'id',
                            'in',
                            oldPositions.map(({ id }) => id),
                        )
                        .set({ workEndDate: restData.date })
                        .execute(),

                    db
                        .updateTable('Job')
                        .where('id', 'in', [...oldPositions.map(({ jobId }) => jobId), requestBefore.jobId])
                        .set({ date: restData.date })
                        .execute(),
                ]));
        }

        const request = await db
            .updateTable('UserCreationRequest')
            .where('id', '=', id)
            .set({
                type: UserCreationRequestType.transferInternToStaff,
                userTargetId: restData.userId,
                email: restData.email,
                login: restData.login,
                name: trimAndJoin([restData.surname, restData.firstName, restData.middleName]),
                organizationUnitId: restData.organizationUnitId,
                percentage: (restData.percentage ?? 1) * percentageMultiply,
                unitId: restData.unitId,
                groupId: restData.groupId || undefined,
                supervisorId: restData.supervisorId,
                title: restData.title || undefined,
                corporateEmail: restData.corporateEmail || undefined,
                createExternalAccount: false,
                workMode: restData.workMode,
                workModeComment: restData.workModeComment,
                workSpace: restData.workSpace,
                location: restData.location,
                date: restData.date,
                comment: restData.comment || undefined,
                workEmail: restData.workEmail || undefined,
                personalEmail: restData.personalEmail || undefined,
                internshipOrganizationId: restData.internshipOrganizationId,
                internshipOrganizationGroup: restData.internshipOrganizationGroup,
                internshipRole: restData.internshipRole,
                internshipSupervisor: restData.internshipSupervisor,
                applicationForReturnOfEquipment: restData.applicationForReturnOfEquipment,
                ...(restData.devices && restData.devices.length && { devices: { toJSON: () => restData.devices } }),
                ...(restData.testingDevices && { testingDevices: { toJSON: () => restData.testingDevices } }),
                services: [],
            })
            .returningAll()
            .returning((eb) => [
                'UserCreationRequest.id',
                jsonArrayFrom(
                    eb
                        .selectFrom('SupplementalPosition as position')
                        .select([
                            'position.organizationUnitId',
                            'position.percentage',
                            'position.unitId',
                            'position.main',
                        ])
                        .whereRef('position.userCreationRequestId', '=', 'UserCreationRequest.id'),
                ).as('supplementalPositions'),
            ])
            .$narrowType<{
                services: JsonValue;
                testingDevices: JsonValue;
                devices: JsonValue;
            }>()
            .executeTakeFirstOrThrow();

        if (mainPositionBefore?.organizationUnitId !== data.organizationUnitId) {
            await sendTransferInternToStaffEmail(requestBefore, ICalCalendarMethod.CANCEL, sessionUserId);
        }

        await sendTransferInternToStaffEmail(request, ICalCalendarMethod.REQUEST, sessionUserId);

        return {
            id: request.id,
            userId: request.userTargetId || undefined,
            groupId: request.groupId || undefined,
            date: request.date || undefined,
            supervisorId: request.supervisorId || undefined,
            comment: request.comment || undefined,
            supplementalPositions: request.supplementalPositions.map((s) => ({
                ...s,
                unitId: s.unitId || undefined,
                percentage: s.percentage / percentageMultiply,
            })),
            workMode: request.workMode || undefined,
            workModeComment: request.workModeComment || undefined,
            workSpace: request.workSpace || undefined,
            location: request.location || undefined,
            internshipOrganizationId: request.internshipOrganizationId || undefined,
            internshipOrganizationGroup: request.internshipOrganizationGroup || undefined,
            internshipRole: request.internshipRole || undefined,
            internshipSupervisor: request.internshipSupervisor || undefined,
            applicationForReturnOfEquipment: request.applicationForReturnOfEquipment || undefined,
            testingDevices: request.testingDevices as Record<'name' | 'id', string>[],
            devices: request.devices as Record<'name' | 'id', string>[],
            lineManagerIds: data.lineManagerIds,
            attachIds: data.attachIds,
        };
    },

    cancelTransferInternToStaff: async (data: { id: string; comment?: string }, sessionUserId: string) => {
        const { id, comment } = data;

        const request = await db
            .selectFrom('UserCreationRequest')
            .selectAll()
            .select((eb) => [
                'UserCreationRequest.id',
                jsonObjectFrom(
                    eb
                        .selectFrom('User as user')
                        .select(['user.id', 'user.email'])
                        .select((eb) => [
                            'user.id',
                            jsonArrayFrom(
                                eb
                                    .selectFrom('SupplementalPosition')
                                    .select([
                                        'SupplementalPosition.id',
                                        'SupplementalPosition.jobId',
                                        'SupplementalPosition.status',
                                        'SupplementalPosition.workEndDate',
                                    ])
                                    .whereRef('SupplementalPosition.userId', '=', 'user.id'),
                            ).as('supplementalPositions'),
                        ])
                        .whereRef('UserCreationRequest.userTargetId', '=', 'user.id'),
                ).as('user'),
            ])
            .where('id', '=', id)
            .$narrowType<{
                services: JsonValue;
                testingDevices: JsonValue;
                devices: JsonValue;
            }>()
            .executeTakeFirstOrThrow();

        await sendTransferInternToStaffEmail(request, ICalCalendarMethod.CANCEL, sessionUserId);

        const oldPositions = request.user?.supplementalPositions.filter((s) => s.status === 'ACTIVE' && s.workEndDate);

        oldPositions &&
            oldPositions.length &&
            (await Promise.all([
                ...oldPositions.map((p) =>
                    db.updateTable('SupplementalPosition').set({ workEndDate: null }).where('id', '=', p.id).execute(),
                ),
                ...oldPositions.map(({ jobId }) => jobId && jobDelete(jobId)),
                request.jobId && jobDelete(request.jobId),
            ]));

        const canceledRequest = await db
            .updateTable('UserCreationRequest')
            .where('id', '=', id)
            .set({ status: 'Canceled', cancelComment: comment })
            .returningAll()
            .executeTakeFirstOrThrow();

        if (!canceledRequest.userTargetId) {
            throw new TRPCError({
                message: `No targetUserId for request ${canceledRequest.id}`,
                code: 'INTERNAL_SERVER_ERROR',
            });
        }

        return canceledRequest.userTargetId;
    },

    createTransferInside: async (data: CreateTransferInside, sessionUserId: string) => {
        const { date, userId, ...restData } = data;
        const user = await userMethods.getById(userId);

        if (!user) {
            throw new TRPCError({ message: `No user with id ${userId}`, code: 'NOT_FOUND' });
        }

        if (!restData.transferToDate) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'No date transfer to specified' });
        }

        const transferToSupplementalPosition = restData.transferToSupplementalPositions
            ? restData.transferToSupplementalPositions[0]
            : undefined;

        const transferDate =
            transferToSupplementalPosition?.workStartDate &&
            restData.transferToDate > transferToSupplementalPosition.workStartDate
                ? transferToSupplementalPosition.workStartDate
                : restData.transferToDate;

        if (!date) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No date transfer from specified' });

        let { disableAccount } = restData;

        if (
            transferDate.getUTCDate() - date.getUTCDate() <= 1 &&
            transferDate.getUTCFullYear() === date.getUTCFullYear() &&
            transferDate.getUTCMonth() === date.getUTCMonth()
        ) {
            disableAccount = false;
        } else disableAccount = true;

        date.setUTCHours(config.deactivateUtcHour);

        await serviceMethods.updateUserServicesInRequest({
            services: user.services,
            userId: user.id,
            phone: data.phone,
            workEmail: data.workEmail,
            personalEmail: data.personalEmail,
        });

        const userUpdateSet: UpdateObjectExpression<DB, 'User', 'User'> = {};

        if (restData.location && user.location?.name !== restData.location) {
            const location = await locationMethods.findOrCreate(restData.location);

            userUpdateSet.locationId = location.id;
        }

        if (user.supervisorId !== restData.supervisorId) {
            userUpdateSet.supervisorId = restData.supervisorId;
        }

        if (Object.values(userUpdateSet).length) {
            await db.updateTable('User').set(userUpdateSet).execute();
        }

        const memberships = await userMethods.getMemberships(user.id);
        const orgMembership = memberships.find((m) => m.group.organizational);

        if (restData.groupId && restData.groupId !== orgMembership?.groupId) {
            orgMembership?.groupId &&
                (await userMethods.removeFromGroup({ userId: user.id, groupId: orgMembership.groupId }));

            const newMembership = await userMethods.addToGroup({
                userId: user.id,
                groupId: restData.groupId,
                percentage: orgMembership?.percentage || undefined,
            });

            const role = await groupRoleMethods.getByName(restData.title);

            if (role && role.name === restData.title) {
                await groupRoleMethods.addToMembership({
                    membershipId: newMembership.id,
                    type: 'existing',
                    id: role.id,
                });
            } else {
                await groupRoleMethods.addToMembership({
                    membershipId: newMembership.id,
                    type: 'new',
                    name: restData.title,
                });
            }
        }

        const request = await db
            .insertInto('UserCreationRequest')
            .values({
                type: restData.type,
                userTargetId: userId,
                email: restData.email,
                login: restData.login,
                name: user.name ?? trimAndJoin([restData.surname, restData.firstName, restData.middleName]),
                creatorId: sessionUserId,
                organizationUnitId: restData.organizationUnitId,
                percentage: (restData.percentage ?? 1) * percentageMultiply,
                unitId: restData.unitId,
                groupId: restData.groupId || undefined,
                supervisorId: restData.supervisorId,
                title: restData.title || undefined,
                corporateEmail: restData.corporateEmail || undefined,
                createExternalAccount: false,
                workMode: restData.workMode,
                workSpace: restData.workSpace,
                location: restData.location,
                date,
                comment: restData.comment || undefined,
                workEmail: restData.workEmail || undefined,
                personalEmail: restData.personalEmail || undefined,
                equipment: restData.equipment,
                extraEquipment: restData.extraEquipment,
                services: [],
                disableAccount,
                transferToGroupId: restData.transferToGroupId,
                transferToSupervisorId: restData.transferToSupervisorId,
                transferToTitle: restData.transferToTitle,
            })
            .returningAll()
            .returning((eb) => [
                eb.cast<JsonValue>('services', 'jsonb').as('services'),
                eb.cast<JsonValue>('devices', 'jsonb').as('devices'),
                eb.cast<JsonValue>('testingDevices', 'jsonb').as('testingDevices'),
            ])
            .executeTakeFirstOrThrow();

        const attaches = data.attachIds?.length
            ? await db
                  .updateTable('Attach')
                  .where('id', 'in', data.attachIds)
                  .set({ userCreationRequestId: request.id })
                  .returningAll()
                  .execute()
            : [];

        if (data.lineManagerIds?.length) {
            await db
                .insertInto('_userLineManagers')
                .values(data.lineManagerIds.map((id) => ({ A: id, B: request.id })))
                .execute();
        }

        if (data.coordinatorIds?.length) {
            await db
                .insertInto('_userCoordinators')
                .values(data.coordinatorIds.map((id) => ({ A: id, B: request.id })))
                .execute();
        }

        const oldPositions = user.supplementalPositions.filter((s) => s.status === 'ACTIVE');
        const oldMainPosition = oldPositions.find((p) => p.main);

        const mainPosition = await supplementalPositionMethods.updateRequestPosition({
            position: oldMainPosition,
            userId,
            date,
            main: true,
            connectToUser: true,
            jobKind: 'scheduledFiringFromSupplementalPosition',
            requestId: request.id,
            updateValues: {
                organizationUnitId: restData.organizationUnitId,
                percentage: restData?.percentage || 1,
                unitId: restData.unitId,
            },
            userCreationRequestKey: 'userCreationRequestId',
        });

        if (!mainPosition) {
            throw new TRPCError({
                message: `no main supplemental position in transfer inside request with id ${request.id}}`,
                code: 'NOT_FOUND',
            });
        }

        const positions = [mainPosition];

        const oldSupplementalPosition = oldPositions.find((p) => !p.main);
        const supplementalPositionTransferFrom = restData.supplementalPositions
            ? restData.supplementalPositions[0]
            : undefined;

        const supplementalPosition = await supplementalPositionMethods.updateRequestPosition({
            position: oldSupplementalPosition,
            userId,
            date,
            main: false,
            connectToUser: true,
            jobKind: 'scheduledFiringFromSupplementalPosition',
            requestId: request.id,
            updateValues: supplementalPositionTransferFrom,
            userCreationRequestKey: 'userCreationRequestId',
        });

        supplementalPosition && positions.push(supplementalPosition);

        transferDate.setUTCHours(config.employmentUtcHour);

        const transferToSupplementalPositionValues = [
            {
                organizationUnitId: restData.transferToOrganizationUnitId,
                workStartDate: transferDate,
                percentage: (restData.transferToPercentage || 1) * percentageMultiply,
                unitId: restData.transferToUnitId,
                main: true,
                userTransferToRequestId: request.id,
            },
        ];

        if (transferToSupplementalPosition) {
            transferToSupplementalPosition.workStartDate &&
                transferToSupplementalPosition.workStartDate.setUTCHours(config.employmentUtcHour);

            transferToSupplementalPositionValues.push({
                organizationUnitId: transferToSupplementalPosition.organizationUnitId,
                workStartDate: transferToSupplementalPosition.workStartDate || transferDate,
                percentage: transferToSupplementalPosition.percentage * percentageMultiply,
                unitId: transferToSupplementalPosition.unitId,
                main: false,
                userTransferToRequestId: request.id,
            });
        }

        const transferToSupplementalPositions = await db
            .insertInto('SupplementalPosition')
            .values(transferToSupplementalPositionValues)
            .returningAll()
            .returning((eb) => [
                'SupplementalPosition.id',
                jsonObjectFrom(
                    eb
                        .selectFrom('OrganizationUnit as o')
                        .select(['o.country', 'o.description', 'o.external', 'o.id', 'o.main', 'o.name'])
                        .whereRef('o.id', '=', 'SupplementalPosition.organizationUnitId')
                        .where('o.id', 'is not', null),
                ).as('organizationUnit'),
            ])
            .$narrowType<{ organizationUnit: OrganizationUnit }>()
            .execute();

        await Promise.all([
            ...transferToSupplementalPositions.map(async (s) => {
                if (s.workStartDate) {
                    await createJob('activateUserSupplementalPosition', {
                        date: s.workStartDate,
                        data: { supplementalPositionId: s.id, userId },
                    });
                }
            }),
        ]);

        await createJob('editUserOnScheduledRequest', {
            date: transferDate,
            data: { userCreationRequestId: request.id },
        });

        disableAccount &&
            (await createJob('scheduledDeactivation', {
                date,
                data: { userId, userCreationRequestId: request.id, method: 'cloud-no-move' },
            }));

        const lineManagers = restData.lineManagerIds?.length
            ? await db.selectFrom('User').selectAll().where('id', 'in', restData.lineManagerIds).execute()
            : [];

        const coordinators = restData.coordinatorIds?.length
            ? await db.selectFrom('User').selectAll().where('id', 'in', restData.coordinatorIds).execute()
            : [];

        await sendDismissalEmailsOnTransferInside({
            request,
            mainPosition,
            user,
            supplementalPositions: positions,
            sessionUserId,
            attaches,
            phone: restData.phone,
            date,
            coordinatorIds: restData.coordinatorIds || [],
            lineManagerIds: restData.lineManagerIds || [],
            method: ICalCalendarMethod.REQUEST,
        });

        const transferToPositionMain = transferToSupplementalPositions.find(({ main }) => main);

        if (!transferToPositionMain) {
            throw new TRPCError({
                message: `no main supplemental position in transfer inside request with id ${request.id}}`,
                code: 'NOT_FOUND',
            });
        }

        await sendNewCommerEmailsOnTransferInside({
            request,
            sessionUserId,
            method: ICalCalendarMethod.REQUEST,
            transferToSupervisorId: request.transferToSupervisorId,
            services: user.services,
            transferToSupplementalPositions,
            transferToGroupId: request.transferToGroupId,
            organization: transferToPositionMain.organizationUnit,
            transferDate,
            lineManagers,
            coordinators,
        });

        return { ...request, supplementalPositions: positions, transferToSupplementalPositions };
    },

    getTransferInsideById: async (id: string): Promise<CreateTransferInside> => {
        const request = await db
            .selectFrom('UserCreationRequest')
            .where('id', '=', id)
            .selectAll()
            .select((eb) => [
                'UserCreationRequest.id',
                jsonArrayFrom(
                    eb
                        .selectFrom('SupplementalPosition as s')
                        .select((eb) => [
                            's.id',
                            's.main',
                            's.organizationUnitId',
                            's.unitId',
                            's.percentage',
                            eb.cast<Date>('s.workStartDate', 'date').as('workStartDate'),
                        ])
                        .whereRef('s.userCreationRequestId', '=', 'UserCreationRequest.id'),
                ).as('supplementalPositions'),
                jsonArrayFrom(
                    eb
                        .selectFrom('SupplementalPosition as s')
                        .select((eb) => [
                            's.id',
                            's.main',
                            's.organizationUnitId',
                            's.unitId',
                            's.percentage',
                            eb.cast<Date>('s.workStartDate', 'date').as('workStartDate'),
                        ])
                        .whereRef('s.userTransferToRequestId', '=', 'UserCreationRequest.id'),
                ).as('supplementalPositionsTransferTo'),
                jsonArrayFrom(
                    eb.selectFrom('_userLineManagers').select('A').whereRef('B', '=', 'UserCreationRequest.id'),
                ).as('lineManagerIds'),
                jsonArrayFrom(
                    eb.selectFrom('_userCoordinators').select('A').whereRef('B', '=', 'UserCreationRequest.id'),
                ).as('coordinatorIds'),
                jsonArrayFrom(
                    eb
                        .selectFrom('Attach as a')
                        .select('a.id')
                        .whereRef('a.userCreationRequestId', '=', 'UserCreationRequest.id'),
                ).as('attachIds'),
                jsonObjectFrom(
                    eb
                        .selectFrom('Group as g')
                        .select(['g.id', 'g.name'])
                        .whereRef('g.id', '=', 'UserCreationRequest.groupId'),
                ).as('group'),
            ])
            .executeTakeFirst();

        if (!request) {
            throw new TRPCError({ message: `No transfer employee inside request with id ${id}`, code: 'NOT_FOUND' });
        }

        if (!request.userTargetId) {
            throw new TRPCError({
                message: `No user in transfer employee inside request with id ${id}`,
                code: 'BAD_REQUEST',
            });
        }

        if (request.type !== UserCreationRequestType.transferInside) {
            throw new TRPCError({
                message: `Request with id ${id} is not transfer employee inside`,
                code: 'BAD_REQUEST',
            });
        }

        const fullNameArray = request.name.split(' ');

        const mainOrganization = request.supplementalPositions.find((s) => s.main);

        const mainTransferToOrganization = request.supplementalPositionsTransferTo.find((s) => s.main);

        const services = await serviceMethods.getUserServices(request.userTargetId);

        const phone = findService(ExternalServiceName.Phone, services);

        return {
            type: request.type,
            disableAccount: Boolean(request.disableAccount),
            surname: fullNameArray[0],
            firstName: fullNameArray[1],
            middleName: fullNameArray[2],
            email: request.email,
            supervisorId: request.supervisorId || '',
            organizationUnitId: mainOrganization?.organizationUnitId || '',
            percentage: (mainOrganization?.percentage || 100) / percentageMultiply,
            unitId: mainOrganization?.unitId || undefined,
            login: request.login,
            date: request.date,
            title: request.title || '',
            workMode: request.workMode || '',
            phone: phone || '',
            workEmail: request.workEmail || '',
            personalEmail: request.personalEmail || '',
            location: request.location || '',
            userId: request.userTargetId,
            groupId: request.groupId || undefined,
            comment: request.comment || undefined,
            supplementalPositions:
                request.supplementalPositions
                    .filter(({ main }) => !main)
                    .map(({ organizationUnitId, percentage, unitId, main }) => ({
                        organizationUnitId,
                        percentage: percentage / percentageMultiply,
                        unitId: unitId || undefined,
                        main,
                    })) || [],
            workSpace: request.workSpace || '',
            lineManagerIds: request.lineManagerIds.map(({ A }) => A),
            coordinatorIds: request.coordinatorIds.map(({ A }) => A),
            attachIds: request.attachIds.map(({ id }) => id),
            transferToOrganizationUnitId: mainTransferToOrganization?.organizationUnitId || '',
            transferToDate: mainTransferToOrganization?.workStartDate
                ? new Date(mainTransferToOrganization.workStartDate)
                : null,
            transferToSupervisorId: request.transferToSupervisorId || '',
            transferToGroupId: request.transferToGroupId || undefined,
            transferToTitle: request.transferToTitle || undefined,
            equipment: request.equipment || '',
            extraEquipment: request.extraEquipment || undefined,
            transferToSupplementalPositions:
                request.supplementalPositionsTransferTo
                    .filter(({ main }) => !main)
                    .map(({ organizationUnitId, percentage, unitId, main, workStartDate }) => ({
                        organizationUnitId,
                        percentage: percentage / percentageMultiply,
                        unitId: unitId || undefined,
                        workStartDate: new Date(workStartDate),
                        main,
                    })) || [],
        };
    },

    getTransferInsideByIdWithRelations: async (id: string) => {
        const request = await db
            .selectFrom('UserCreationRequest')
            .selectAll()
            .select((eb) => [
                'UserCreationRequest.id',
                jsonArrayFrom(
                    eb
                        .selectFrom('SupplementalPosition as s')
                        .selectAll()
                        .select((eb) => [
                            jsonObjectFrom(
                                eb
                                    .selectFrom('OrganizationUnit as o')
                                    .select(['o.country', 'o.description', 'o.external', 'o.id', 'o.main', 'o.name'])
                                    .whereRef('o.id', '=', 's.organizationUnitId')
                                    .where('o.id', 'is not', null),
                            ).as('organizationUnit'),
                        ])
                        .$narrowType<{
                            organizationUnit: OrganizationUnit;
                            percentage: number;
                            status: PositionStatus;
                        }>()
                        .whereRef('s.userCreationRequestId', '=', 'UserCreationRequest.id'),
                ).as('supplementalPositions'),
                jsonArrayFrom(
                    eb
                        .selectFrom('SupplementalPosition as s')
                        .selectAll()
                        .select((eb) => [
                            jsonObjectFrom(
                                eb
                                    .selectFrom('OrganizationUnit')
                                    .select([
                                        'OrganizationUnit.country as country',
                                        'OrganizationUnit.description as description',
                                        'OrganizationUnit.external as external',
                                        'OrganizationUnit.id as id',
                                        'OrganizationUnit.name as name',
                                    ])
                                    .whereRef('OrganizationUnit.id', '=', 's.organizationUnitId'),
                            ).as('organizationUnit'),
                        ])
                        .$narrowType<{
                            organizationUnit: OrganizationUnit;
                            percentage: number;
                            status: PositionStatus;
                        }>()
                        .whereRef('s.userTransferToRequestId', '=', 'UserCreationRequest.id'),
                ).as('supplementalPositionsTransferTo'),
                jsonArrayFrom(
                    eb
                        .selectFrom('Attach as a')
                        .select([
                            'a.createdAt',
                            'a.deletedAt',
                            'a.filename',
                            'a.id',
                            'a.link',
                            'a.userCreationRequestId',
                            'a.scheduledDeactivationId',
                        ])
                        .whereRef('a.userCreationRequestId', '=', 'UserCreationRequest.id'),
                ).as('attaches'),
                jsonArrayFrom(
                    eb.selectFrom('_userLineManagers').select('A').whereRef('B', '=', 'UserCreationRequest.id'),
                ).as('lineManagerIds'),
                jsonArrayFrom(
                    eb.selectFrom('_userCoordinators').select('A').whereRef('B', '=', 'UserCreationRequest.id'),
                ).as('coordinatorIds'),
                jsonObjectFrom(
                    eb
                        .selectFrom('User as u')
                        .selectAll()
                        .whereRef('u.id', '=', 'UserCreationRequest.transferToSupervisorId'),
                ).as('transferToSupervisor'),
                jsonObjectFrom(
                    eb.selectFrom('User as u').select('name').whereRef('u.id', '=', 'UserCreationRequest.supervisorId'),
                ).as('supervisor'),
                jsonObjectFrom(
                    eb
                        .selectFrom('Group as g')
                        .selectAll()
                        .whereRef('g.id', '=', 'UserCreationRequest.transferToGroupId'),
                ).as('transferToGroup'),
                eb.cast<JsonValue>('services', 'json').as('services'),
                eb.cast<JsonValue>('devices', 'json').as('devices'),
                eb.cast<JsonValue>('testingDevices', 'json').as('testingDevices'),
            ])
            .where('id', '=', id)
            .executeTakeFirst();

        if (!request) {
            throw new TRPCError({ code: 'NOT_FOUND', message: `No user transfer inside SD request with id ${id}` });
        }
        const lineManagerIds = request.lineManagerIds.map(({ A }) => A);
        const lineManagers = lineManagerIds.length
            ? await db.selectFrom('User').selectAll().where('id', 'in', lineManagerIds).execute()
            : [];

        const coordinatorIds = request.coordinatorIds.map(({ A }) => A);
        const coordinators = coordinatorIds.length
            ? await db.selectFrom('User').selectAll().where('id', 'in', coordinatorIds).execute()
            : [];

        return { ...request, lineManagerIds, lineManagers, coordinatorIds, coordinators };
    },

    cancelTransferInside: async (data: { id: string; comment?: string }, sessionUserId: string) => {
        const { id, comment } = data;

        const request = await userCreationRequestsMethods.getTransferInsideByIdWithRelations(id);

        if (!request.userTargetId) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: `No userTargetId in user transfer inside SD request with id ${id}`,
            });
        }

        const user = await userMethods.getById(request.userTargetId);

        if (!user) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: `No user found with id ${id}`,
            });
        }

        if (!request.date) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: `No transfer date in transfer inside SD request with id ${id}`,
            });
        }

        const mainPosition = request.supplementalPositions.find(({ main }) => main);

        if (!mainPosition) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: `No mainPosition in transfer inside SD request with id ${id}`,
            });
        }

        await db
            .updateTable('UserCreationRequest')
            .where('id', '=', request.id)
            .set({ status: 'Canceled', cancelComment: comment })
            .execute();

        await Promise.all([
            ...request.supplementalPositions.map((s) => {
                db.updateTable('SupplementalPosition').where('id', '=', s.id).set({ workEndDate: null }).execute();
                return s.jobId && jobDelete(s.jobId);
            }),
            ...request.supplementalPositionsTransferTo.map(async (s) => {
                return s.jobId && jobDelete(s.jobId);
            }),
            request.jobId && jobDelete(request.jobId),
            request.disableAccountJobId && jobDelete(request.disableAccountJobId),
        ]);

        const supplementalPositionsToDisconnect = request.supplementalPositions.filter((p) => p.userCreationRequestId);

        await db
            .updateTable('SupplementalPosition')
            .where(
                'id',
                'in',
                supplementalPositionsToDisconnect.map(({ id }) => id),
            )
            .set({ userCreationRequestId: null })
            .execute();

        await db
            .insertInto('SupplementalPosition')
            .values(
                supplementalPositionsToDisconnect.map(({ id, userId, organizationUnit, jobId, ...restData }) => ({
                    ...restData,
                })),
            )
            .execute();

        await sendDismissalEmailsOnTransferInside({
            request,
            mainPosition,
            user,
            supplementalPositions: request.supplementalPositions,
            sessionUserId,
            attaches: request.attaches,
            phone: findService(ExternalServiceName.Phone, user.services) || '',
            date: request.date,
            lineManagerIds: request.lineManagerIds,
            coordinatorIds: request.coordinatorIds,
            method: ICalCalendarMethod.CANCEL,
        });

        const transferToPositionMain = request.supplementalPositionsTransferTo.find(({ main }) => main);

        if (!transferToPositionMain) {
            throw new TRPCError({
                message: `no main supplemental position in transfer inside request with id ${request.id}}`,
                code: 'NOT_FOUND',
            });
        }

        const transferDate = supplementalPositionsDate(request.supplementalPositionsTransferTo, 'workStartDate');

        await sendNewCommerEmailsOnTransferInside({
            request,
            sessionUserId,
            method: ICalCalendarMethod.CANCEL,
            transferToSupervisorId: request.transferToSupervisorId,
            services: user.services,
            transferToSupplementalPositions: request.supplementalPositionsTransferTo,
            transferToGroupId: request.transferToGroupId,
            organization: transferToPositionMain.organizationUnit,
            transferDate,
            lineManagers: request.lineManagers,
            coordinators: request.coordinators,
        });

        return request.userTargetId;
    },

    editTransferInside: async (data: EditTransferInside, sessionUserId: string) => {
        const { date, id, ...restData } = data;

        const request = await userCreationRequestsMethods.getTransferInsideByIdWithRelations(id);
        if (!request.userTargetId) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: `No userTargetId in user transfer inside SD request with id ${id}`,
            });
        }

        const user = await userMethods.getById(request.userTargetId);

        if (!user) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: `No user found with id ${id}`,
            });
        }

        if (!restData.transferToDate) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'No date transfer to specified' });
        }

        await serviceMethods.updateUserServicesInRequest({
            services: user.services,
            userId: user.id,
            phone: data.phone,
            workEmail: data.workEmail,
            personalEmail: data.personalEmail,
        });

        const transferToSupplementalPosition =
            restData.transferToSupplementalPositions && restData.transferToSupplementalPositions[0];

        const transferDate =
            transferToSupplementalPosition?.workStartDate &&
            restData.transferToDate > transferToSupplementalPosition.workStartDate
                ? transferToSupplementalPosition.workStartDate
                : restData.transferToDate;

        const transferToSupplementalPositionMainBefore = request.supplementalPositionsTransferTo.find(
            ({ main }) => main,
        );

        const updatedMainTransferPosition = await supplementalPositionMethods.updateRequestPosition({
            position: transferToSupplementalPositionMainBefore,
            userId: request.userTargetId,
            date: restData.transferToDate,
            main: true,
            jobKind: 'activateUserSupplementalPosition',
            requestId: request.id,
            updateValues: {
                organizationUnitId: restData.transferToOrganizationUnitId,
                percentage: restData?.transferToPercentage || 1,
                unitId: restData.transferToUnitId,
            },
            userCreationRequestKey: 'userTransferToRequestId',
        });
        if (!updatedMainTransferPosition) {
            throw new TRPCError({
                message: `no transfer to main supplemental position in transfer inside request with id ${request.id}}`,
                code: 'NOT_FOUND',
            });
        }

        const positionsTo = [updatedMainTransferPosition];

        const transferToSupplementalPositionBefore = request.supplementalPositionsTransferTo.find(({ main }) => !main);

        const updatedSupplementalTransferPosition = await supplementalPositionMethods.updateRequestPosition({
            position: transferToSupplementalPositionBefore,
            userId: request.userTargetId,
            date: transferToSupplementalPosition?.workStartDate || transferDate,
            main: false,
            jobKind: 'activateUserSupplementalPosition',
            requestId: request.id,
            updateValues: transferToSupplementalPosition,
            userCreationRequestKey: 'userTransferToRequestId',
        });

        updatedSupplementalTransferPosition && positionsTo.push(updatedSupplementalTransferPosition);

        if (!date) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No date transfer from specified' });

        let { disableAccount } = restData;

        if (
            transferDate.getUTCDate() - date.getUTCDate() <= 1 &&
            transferDate.getUTCFullYear() === date.getUTCFullYear() &&
            transferDate.getUTCMonth() === date.getUTCMonth()
        ) {
            disableAccount = false;
        } else disableAccount = true;

        if (!disableAccount && request.disableAccountJobId) {
            await jobDelete(request.disableAccountJobId);
        }

        if (request.disableAccountJobId && disableAccount) {
            await db.updateTable('Job').where('id', '=', request.disableAccountJobId).set({ date }).execute();
        }

        const setUpdate: UpdateObjectExpression<DB, 'UserCreationRequest'> = {
            type: restData.type,
            email: restData.email,
            login: restData.login,
            name: user.name ?? trimAndJoin([restData.surname, restData.firstName, restData.middleName]),
            creatorId: sessionUserId,
            organizationUnitId: restData.organizationUnitId,
            percentage: (restData.percentage ?? 1) * percentageMultiply,
            unitId: restData.unitId,
            groupId: restData.groupId || undefined,
            supervisorId: restData.supervisorId,
            title: restData.title || undefined,
            corporateEmail: restData.corporateEmail || undefined,
            createExternalAccount: false,
            workMode: restData.workMode,
            workSpace: restData.workSpace,
            location: restData.location,
            date,
            comment: restData.comment || undefined,
            workEmail: restData.workEmail || undefined,
            personalEmail: restData.personalEmail || undefined,
            equipment: restData.equipment,
            extraEquipment: restData.extraEquipment,
            services: [],
            disableAccount,
            transferToGroupId: restData.transferToGroupId,
            transferToSupervisorId: restData.transferToSupervisorId,
            transferToTitle: restData.transferToTitle,
        };

        if (date !== request.date && request.jobId) {
            await db.updateTable('Job').where('id', '=', request.jobId).set({ date: transferDate }).execute();
        }

        if (!request.date || !request.jobId) {
            await createJob('editUserOnScheduledRequest', {
                date: transferDate,
                data: { userCreationRequestId: request.id },
            });
        }

        if (!request.disableAccountJobId && disableAccount) {
            await createJob('scheduledDeactivation', {
                date,
                data: { userId: request.userTargetId, userCreationRequestId: request.id, method: 'cloud-no-move' },
            });
        }

        date.setUTCHours(config.deactivateUtcHour);

        const oldMainPosition = request.supplementalPositions.find(({ main }) => main);

        const updatedMainPosition = await supplementalPositionMethods.updateRequestPosition({
            position: oldMainPosition,
            userId: request.userTargetId,
            date,
            main: true,
            jobKind: 'scheduledFiringFromSupplementalPosition',
            requestId: request.id,
            connectToUser: true,
            updateValues: {
                organizationUnitId: restData.organizationUnitId,
                percentage: restData?.percentage || 1,
                unitId: restData.unitId,
            },
            userCreationRequestKey: 'userCreationRequestId',
        });

        if (!updatedMainPosition) {
            throw new TRPCError({
                message: `no main supplemental position in transfer inside request with id ${request.id}}`,
                code: 'NOT_FOUND',
            });
        }

        const positions = [updatedMainPosition];

        const oldSupplementalPosition = request.supplementalPositions.find(({ main }) => !main);
        const supplementalPosition = restData.supplementalPositions && restData.supplementalPositions[0];

        const updatedSupplementalPosition = await supplementalPositionMethods.updateRequestPosition({
            position: oldSupplementalPosition,
            userId: request.userTargetId,
            date,
            main: false,
            connectToUser: true,
            jobKind: 'scheduledFiringFromSupplementalPosition',
            requestId: request.id,
            updateValues: supplementalPosition,
            userCreationRequestKey: 'userTransferToRequestId',
        });

        updatedSupplementalPosition && positions.push(updatedSupplementalPosition);

        const updatedRequest = await db
            .updateTable('UserCreationRequest')
            .where('id', '=', request.id)
            .set(setUpdate)
            .returningAll()
            .returning((eb) => [
                jsonArrayFrom(
                    eb
                        .selectFrom('Attach as a')
                        .selectAll()
                        .whereRef('a.userCreationRequestId', '=', 'UserCreationRequest.id'),
                ).as('attaches'),
                jsonArrayFrom(
                    eb.selectFrom('_userLineManagers').select('A').whereRef('B', '=', 'UserCreationRequest.id'),
                ).as('lineManagerIds'),
                jsonArrayFrom(
                    eb.selectFrom('_userCoordinators').select('A').whereRef('B', '=', 'UserCreationRequest.id'),
                ).as('coordinatorIds'),
                eb.cast<JsonValue>('services', 'jsonb').as('services'),
                eb.cast<JsonValue>('devices', 'jsonb').as('devices'),
                eb.cast<JsonValue>('testingDevices', 'jsonb').as('testingDevices'),
            ])
            .executeTakeFirst();

        if (!updatedRequest) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Can not update request with id ${id}` });
        }

        const attachIdsToAdd =
            data.attachIds?.filter((attachId) => !request.attaches.map(({ id }) => id).includes(attachId)) || [];

        const attaches = attachIdsToAdd.length
            ? await db
                  .updateTable('Attach')
                  .where('id', 'in', attachIdsToAdd)
                  .set({ userCreationRequestId: request.id })
                  .returningAll()
                  .execute()
            : [];

        if (request.lineManagerIds.length) {
            await db
                .deleteFrom('_userLineManagers')
                .where('B', '=', request.id)
                .where('A', 'in', request.lineManagerIds)
                .execute();
        }

        if (data.lineManagerIds?.length) {
            await db
                .insertInto('_userLineManagers')
                .values(data.lineManagerIds.map((id) => ({ A: id, B: request.id })))
                .execute();
        }

        if (request.coordinatorIds.length) {
            await db
                .deleteFrom('_userCoordinators')
                .where('B', '=', request.id)
                .where('A', 'in', request.coordinatorIds)
                .execute();
        }

        if (data.coordinatorIds?.length) {
            await db
                .insertInto('_userCoordinators')
                .values(data.coordinatorIds.map((id) => ({ A: id, B: request.id })))
                .execute();
        }

        await sendDismissalEmailsOnTransferInside({
            request: updatedRequest,
            mainPosition: updatedMainPosition,
            user,
            supplementalPositions: positions,
            sessionUserId,
            attaches,
            phone: restData.phone,
            date,
            lineManagerIds: restData.lineManagerIds || [],
            coordinatorIds: restData.coordinatorIds || [],
            method: ICalCalendarMethod.REQUEST,
        });

        const lineManagers = restData.lineManagerIds?.length
            ? await db.selectFrom('User').selectAll().where('id', 'in', restData.lineManagerIds).execute()
            : [];

        const coordinators = restData.coordinatorIds?.length
            ? await db.selectFrom('User').selectAll().where('id', 'in', restData.coordinatorIds).execute()
            : [];

        await sendNewCommerEmailsOnTransferInside({
            request: updatedRequest,
            sessionUserId,
            method: ICalCalendarMethod.REQUEST,
            transferToSupervisorId: updatedRequest.transferToSupervisorId,
            services: user.services,
            transferToSupplementalPositions: positionsTo,
            transferToGroupId: updatedRequest.transferToGroupId,
            organization: updatedMainTransferPosition.organizationUnit,
            transferDate,
            lineManagers,
            coordinators,
        });

        const positionIds = positions.map(({ id }) => id);

        const positionsToCancelDismissalEvents = request.supplementalPositions.filter(
            ({ id }) => !positionIds.includes(id),
        );

        if (positionsToCancelDismissalEvents.length) {
            await sendDismissalEmailsOnTransferInside({
                request,
                mainPosition: oldMainPosition || updatedMainPosition,
                user,
                supplementalPositions: positionsToCancelDismissalEvents,
                sessionUserId,
                attaches: request.attaches,
                phone: findService(ExternalServiceName.Phone, user.services) || '',
                date: request.date || date,
                lineManagerIds: request.lineManagerIds,
                coordinatorIds: request.coordinatorIds,
                method: ICalCalendarMethod.CANCEL,
            });
        }

        const positionToIds = positionsTo.map(({ id }) => id);

        const positionToCancelEvents = request.supplementalPositionsTransferTo.filter(
            ({ id }) => !positionToIds.includes(id),
        );

        if (positionToCancelEvents.length) {
            const transferToPositionMain = request.supplementalPositionsTransferTo.find(({ main }) => main);

            if (!transferToPositionMain) {
                throw new TRPCError({
                    message: `no main supplemental position in transfer inside request with id ${request.id}}`,
                    code: 'NOT_FOUND',
                });
            }

            const transferDate = supplementalPositionsDate(request.supplementalPositionsTransferTo, 'workStartDate');

            await sendNewCommerEmailsOnTransferInside({
                request,
                sessionUserId,
                method: ICalCalendarMethod.CANCEL,
                transferToSupervisorId: request.transferToSupervisorId,
                services: user.services,
                transferToSupplementalPositions: request.supplementalPositionsTransferTo,
                transferToGroupId: request.transferToGroupId,
                organization: transferToPositionMain.organizationUnit,
                transferDate,
                lineManagers: request.lineManagers,
                coordinators: request.coordinators,
            });
        }

        return { ...updatedRequest, supplementalPositions: positions, transferToSupplementalPositions: positionsTo };
    },

    createUserRequestDraft: async (input: CreateUserCreationRequestDraft) => {
        try {
            const isLoginUnique = await userMethods.isLoginUnique(input.login);

            if (isLoginUnique === false) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `User with login ${input.login} already exist`,
                });
            }
            const mainOrganization = input.organizations.find((o) => o.main);
            const organizationUnitId = mainOrganization?.organizationUnitId;

            if (!organizationUnitId) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Organization unit ID is required',
                });
            }

            return await db.transaction().execute(async (trx) => {
                const lineManagerEmails = input.lineManagers?.map((lm) => lm.email) || [];
                const coordinatorEmails = input.coordinators?.map((c) => c.email) || [];

                const allEmails = [input.supervisorEmail, ...lineManagerEmails, ...coordinatorEmails];

                const userMapByEmail = await findUsersByEmails(allEmails);

                const supervisorId = userMapByEmail[input.supervisorEmail]?.id;
                const supervisorLogin = userMapByEmail[input.supervisorEmail]?.login;

                if (!supervisorId) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: `Supervisor with email ${input.supervisorEmail} not found`,
                    });
                }

                const coordinators =
                    (input.coordinators
                        ?.map((c) => userMapByEmail[c.email])
                        .filter(Boolean) as ExtractTypeFromGenerated<KyselyUser>[]) || [];

                const lineManagers =
                    (input.lineManagers
                        ?.map((lm) => userMapByEmail[lm.email])
                        .filter(Boolean) as ExtractTypeFromGenerated<KyselyUser>[]) || [];

                const phoneService = input.phone
                    ? await trx
                          .selectFrom('ExternalService')
                          .select(['name'])
                          .where('name', '=', ExternalServiceName.Phone)
                          .executeTakeFirst()
                    : null;

                const servicesData: { serviceName: string; serviceId: string }[] = [];

                if (phoneService && input.phone) {
                    servicesData.push({ serviceName: phoneService.name, serviceId: input.phone });
                }

                const corporateEmail = getCorporateEmail(input.login);

                const creationRequest = await trx
                    .insertInto('UserCreationRequest')
                    .values({
                        type: 'internalEmployee',
                        creationCause: 'start',
                        status: UserCreationRequestStatus.Draft,
                        name: input.name,
                        email: corporateEmail,
                        workEmail: corporateEmail,
                        corporateEmail,
                        personalEmail: input.registrationEmail,
                        login: input.login,
                        title: input.position,
                        organizationUnitId,
                        unitId: mainOrganization.unitId,
                        date: new Date(mainOrganization?.startDate),
                        percentage: (mainOrganization?.percentage || 1) * percentageMultiply,
                        supervisorLogin,
                        supervisorId,
                        location: input.location,
                        externalPersonId: input.externalPersonId,
                        externalGroupId: input.externalGroupId,
                        createExternalAccount: true,
                        accessToInternalSystems: false,
                        services: JSON.stringify(servicesData),
                    })
                    .returningAll()
                    .$narrowType<{
                        services: JsonValue;
                    }>()
                    .executeTakeFirstOrThrow();

                const supplementalPositions = await trx
                    .insertInto('SupplementalPosition')
                    .values(
                        input.organizations.map((org) => ({
                            organizationUnitId: org.organizationUnitId,
                            percentage: (org.percentage || 1) * percentageMultiply,
                            role: input.position || undefined,
                            status: PositionStatus.ACTIVE,
                            unitId: org.unitId || null,
                            workStartDate: new Date(org.startDate),
                            main: !!org.main,
                            userCreationRequestId: creationRequest.id,
                        })),
                    )
                    .returningAll()
                    .$castTo<ExtractTypeFromGenerated<KyselySupplementalPosition>>()
                    .execute();

                if (coordinators.length > 0) {
                    await trx
                        .insertInto('_userCoordinators')
                        .values(coordinators.map((c) => ({ A: c.id, B: creationRequest.id })))
                        .execute();
                }

                if (lineManagers.length > 0) {
                    await trx
                        .insertInto('_userLineManagers')
                        .values(lineManagers.map((l) => ({ A: l.id, B: creationRequest.id })))
                        .execute();
                }

                // TODO: send email to supervisor and coordinators

                return {
                    ...creationRequest,
                    supplementalPositions,
                    coordinators,
                    lineManagers,
                };
            });
        } catch (error) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to create user request',
            });
        }
    },

    confirmDraftRequest: async (id: string, sessionUserId: string) => {
        try {
            const draftRequest = await db
                .selectFrom('UserCreationRequest')
                .where('UserCreationRequest.id', '=', id)
                .selectAll()
                .executeTakeFirst();

            if (!draftRequest) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `User creation request with id ${id} not found`,
                });
            }

            if (draftRequest.status !== UserCreationRequestStatus.Draft) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Only draft requests can be confirmed',
                });
            }

            if (
                !draftRequest.date ||
                !draftRequest.title ||
                !draftRequest.supervisorId ||
                !draftRequest.location ||
                !draftRequest.creationCause ||
                !draftRequest.workMode ||
                !draftRequest.equipment ||
                !draftRequest.login ||
                !draftRequest.name ||
                !draftRequest.email ||
                !draftRequest.organizationUnitId ||
                !draftRequest.type
            ) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Some data is missing for request with id ${id}`,
                });
            }

            await db
                .updateTable('UserCreationRequest')
                .set({
                    status: UserCreationRequestStatus.Approved,
                })
                .where('UserCreationRequest.id', '=', id)
                .execute();

            const confirmedRequest = await getUserCreationRequestById(id);

            if (!confirmedRequest) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to get updated request',
                });
            }

            const { to } = await userMethods.getMailingList('createUserRequest', [confirmedRequest.organizationUnitId]);

            const requestLink = pages.internalUserRequest(confirmedRequest.id);
            const mailText = userCreationMailText(confirmedRequest.name, requestLink);
            const subject = tr('New user request {userName}', { userName: confirmedRequest.name });

            sendMail({
                to,
                subject,
                text: mailText,
            });

            if (confirmedRequest.date) {
                await sendNewCommerEmails({
                    request: confirmedRequest,
                    sessionUserId,
                    method: ICalCalendarMethod.REQUEST,
                });
            }

            return confirmedRequest;
        } catch (error) {
            if (error instanceof TRPCError) {
                throw error;
            }
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to confirm draft request',
            });
        }
    },

    editUserRequestDraft: async (data: CreateUserCreationRequestDraft, sessionUserId: string) => {
        try {
            const { externalPersonId, ...updateData } = data;

            const existingRequest = await getUserCreationRequestByExternalPersonId(externalPersonId);

            if (!existingRequest) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `No creation request found for externalPersonId: ${externalPersonId}`,
                });
            }

            if (existingRequest.type !== 'internalEmployee') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Only internalEmployee requests can be edited through this endpoint',
                });
            }

            const organization = updateData.organizations[0];

            const [surname, firstName, middleName] = updateData.name.split(' ');

            const lineManagerEmails = updateData.lineManagers?.map((lm) => lm.email) || [];
            const coordinatorEmails = updateData.coordinators?.map((coord) => coord.email) || [];
            const allEmails = [updateData.supervisorEmail, ...lineManagerEmails, ...coordinatorEmails];

            const userMap = await findUsersByEmails(allEmails);

            const supervisor = userMap[updateData.supervisorEmail];

            if (!supervisor) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Supervisor with email ${updateData.supervisorEmail} not found`,
                });
            }

            const lineManagerIds = lineManagerEmails
                .map((email) => userMap[email]?.id)
                .filter((id): id is string => !!id);

            const coordinatorIds = coordinatorEmails
                .map((email) => userMap[email]?.id)
                .filter((id): id is string => !!id);

            return await userCreationRequestsMethods.edit(
                {
                    id: existingRequest.id,
                    data: {
                        type: 'internalEmployee',
                        surname,
                        firstName,
                        middleName,
                        login: updateData.login,
                        phone: updateData.phone,
                        email: updateData.workEmail || updateData.registrationEmail,
                        personalEmail: updateData.registrationEmail,
                        workEmail: updateData.workEmail,
                        corporateEmail: updateData.workEmail,
                        title: updateData.position,
                        supervisorId: supervisor.id,
                        organizationUnitId: organization.organizationUnitId,
                        externalGroupId: updateData.externalGroupId,
                        date: organization.startDate ? new Date(organization.startDate) : null,
                        percentage: organization.percentage,
                        unitId: organization.unitId,
                        location: updateData.location,
                        creationCause: existingRequest.creationCause ?? 'start',
                        workMode: existingRequest.workMode ?? undefined,
                        equipment: existingRequest.equipment ?? undefined,
                        extraEquipment: existingRequest.extraEquipment ?? undefined,
                        workSpace: existingRequest.workSpace ?? undefined,
                        lineManagerIds,
                        coordinatorIds,
                        intern: existingRequest.supplementalPositions.some((pos) => pos.intern) || false,
                        osPreference: existingRequest.osPreference ?? undefined,
                        supplementalPositions: existingRequest.supplementalPositions
                            .filter((pos) => !pos.main)
                            .map((pos) => ({
                                organizationUnitId: pos.organizationUnitId,
                                percentage: pos.percentage / percentageMultiply,
                                unitId: pos.unitId || undefined,
                                workStartDate: pos.workStartDate,
                            })),
                    },
                },
                existingRequest,
                sessionUserId,
            );
        } catch (error) {
            if (error instanceof TRPCError) {
                throw error;
            }

            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to update user request',
            });
        }
    },

    getSupplementalPositionRequestById: async (id: string): Promise<UserCreationRequestWithRelations> => {
        const request = await userCreationRequestsMethods.getById(id);
        const { type } = request;

        if (type !== UserCreationRequestType.createSuppementalPosition) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Wrong type in request ${id} - ${type} instead of UserCreationRequestType.createSuppementalPosition`,
            });
        }

        const { userTargetId } = request;

        if (!userTargetId) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: `No userTargetId for request ${id}` });
        }

        return request;
    },
};
