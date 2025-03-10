import { UserCreationRequest, Prisma, User, PermissionService, SupplementalPosition } from 'prisma/prisma-client';
import { TRPCError } from '@trpc/server';
import { ICalCalendarMethod } from 'ical-generator';

import { prisma } from '../utils/prisma';
import { trimAndJoin } from '../utils/trimAndJoin';
import { config } from '../config';
import {
    htmlFromDecreeRequest,
    htmlToDecreeRequest,
    htmlUserCreationRequestWithDate,
    newcomerSubject,
    userCreationMailText,
} from '../utils/emailTemplates';
import { getOrgUnitTitle } from '../utils/organizationUnit';
import { createJob } from '../worker/create';
import { jobUpdate, jobDelete } from '../worker/jobOperations';
import { percentageMultiply } from '../utils/suplementPosition';
import { PositionStatus } from '../generated/kyselyTypes';
import { userCreationRequestPhone } from '../utils/createUserCreationRequest';
import { pages } from '../hooks/useRouter';
import { ExternalServiceName, findService } from '../utils/externalServices';

import { userMethods } from './userMethods';
import { calendarEvents, createIcalEventData, nodemailerAttachments, sendMail } from './nodemailer';
import { tr } from './modules.i18n';
import {
    CreateUserCreationRequest,
    CreateUserCreationRequestExternalEmployee,
    CreateUserCreationRequestexternalFromMainOrgEmployee,
    CreateUserCreationRequestInternalEmployee,
    EditUserCreationRequest,
    GetUserCreationRequestList,
    HandleUserCreationRequest,
    UserDecreeEditSchema,
    UserDecreeSchema,
} from './userCreationRequestSchemas';
import {
    CompleteUserCreationRequest,
    BaseUserCreationRequest,
    UserDecreeRequest,
    UserCreationRequestWithRelations,
} from './userCreationRequestTypes';

interface SendNewcomerEmails {
    request: UserCreationRequestWithRelations;
    sessionUserId: string;
    method: ICalCalendarMethod.REQUEST | ICalCalendarMethod.CANCEL;
    newOrganizationIds?: string[];
}

const sendNewCommerEmails = ({ request, sessionUserId, method, newOrganizationIds }: SendNewcomerEmails) =>
    Promise.all(
        request.supplementalPositions.map(async ({ organizationUnitId, workStartDate, main }) => {
            if (!workStartDate) return;

            if (
                method === ICalCalendarMethod.CANCEL &&
                newOrganizationIds &&
                newOrganizationIds.includes(organizationUnitId)
            ) {
                return;
            }

            const additionalEmails = [sessionUserId];

            if (request.creatorId && request.creatorId !== sessionUserId) additionalEmails.push(request.creatorId);

            if (request.supervisorId && main) additionalEmails.push(request.supervisorId);

            if (request.buddyId && main) additionalEmails.push(request.buddyId);

            const { users, to } = await userMethods.getMailingList(
                'createScheduledUserRequest',
                [organizationUnitId],
                additionalEmails,
                !!request.workSpace,
            );
            const subject = newcomerSubject({
                userCreationRequest: request,
                phone: userCreationRequestPhone(request),
                name: request.name,
                intern: !!request.supplementalPositions.find(({ intern }) => intern),
            });

            const icalEvent = createIcalEventData({
                id: request.id + config.nodemailer.authUser + organizationUnitId,
                start: workStartDate,
                duration: 30,
                users,
                summary: subject,
                description: subject,
            });

            const html = htmlUserCreationRequestWithDate({
                userCreationRequest: request,
                date: workStartDate,
            });
            sendMail({
                to,
                subject,
                html,
                icalEvent: calendarEvents({
                    method,
                    events: [icalEvent],
                }),
            });
        }),
    );

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

        if (data.type === 'toDecree' && data.firedOrganizationUnitId) {
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
                supervisorLogin: supervisor?.login,
                supervisorId: data.supervisorId || undefined,
                buddyLogin: buddy?.login || undefined,
                buddyId: buddy?.id || undefined,
                coordinators: { connect: data.coordinatorIds?.map((id) => ({ id })) },
                title: data.title || undefined,
                corporateEmail: data.corporateEmail || undefined,
                createExternalAccount: Boolean(data.createExternalAccount),
                disableAccount: data.type === 'toDecree' ? data.disableAccount : false,
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

        const html = data.type === 'fromDecree' ? htmlFromDecreeRequest(request) : htmlToDecreeRequest(request);

        const { to: mailTo } = await userMethods.getMailingList(
            'createScheduledUserRequest',
            [data.organizationUnitId],
            [sessionUserId],
        );

        const attachments = await nodemailerAttachments(request.attaches);

        const subject = `${data.type === 'fromDecree' ? tr('From decree') : tr('To decree')} ${
            request.name
        } ${getOrgUnitTitle(request.organization)} ${data.phone}`;

        sendMail({
            to: mailTo,
            subject,
            html,
            attachments,
        });

        return request;
    },

    getById: async (id: string) => {
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

            if (requestBeforeUpdate.jobId) await jobUpdate(requestBeforeUpdate.jobId, { date: editData.date });
        }
        return updatedRequest;
    },

    editDecree: async (
        data: UserDecreeEditSchema,
        requestBeforeUpdate: UserCreationRequest & { supplementalPositions: SupplementalPosition[] },
        sessionUserId: string,
    ) => {
        const { id, ...editData } = data;

        if (requestBeforeUpdate.status === 'Denied') {
            throw new TRPCError({ code: 'FORBIDDEN', message: `Forbidden to edit denied request id: ${id}` });
        }

        const currentUser = await userMethods.getById(data.userTargetId);

        const status = data.type === 'toDecree' ? PositionStatus.DECREE : PositionStatus.ACTIVE;

        editData.date && editData.date.setUTCHours(config.employmentUtcHour);

        const supplementalPositionsToDisconnect = requestBeforeUpdate.supplementalPositions.reduce<{ id: string }[]>(
            (acum, item) => {
                const isInFired =
                    editData.type === 'toDecree' &&
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
            const { to } = await userMethods.getMailingList(
                'createScheduledUserRequest',
                [updatedRequest.organizationUnitId],
                [sessionUserId],
            );

            const html =
                data.type === 'fromDecree'
                    ? htmlFromDecreeRequest(updatedRequest)
                    : htmlToDecreeRequest(updatedRequest);

            const subject = `${data.type === 'fromDecree' ? tr('From decree') : tr('To decree')} ${
                updatedRequest.name
            } ${getOrgUnitTitle(updatedRequest.organization)} ${data.phone}`;

            sendMail({
                to,
                subject,
                html,
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
            data: { status: 'Denied', comment },
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
        if (canceledRequest.jobId) await jobDelete(canceledRequest.jobId);

        const additionalEmails = [sessionUserId];

        if (canceledRequest.supervisorId) additionalEmails.push(canceledRequest.supervisorId);

        if (canceledRequest.buddyId) additionalEmails.push(canceledRequest.buddyId);

        if (canceledRequest.type === 'internalEmployee') {
            await sendNewCommerEmails({
                request: canceledRequest,
                sessionUserId,
                method: ICalCalendarMethod.REQUEST,
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
            ...restRequest
        } = request;

        const fullNameArray = name.split(' ');

        const phone = findService(ExternalServiceName.Phone, services as { serviceId: string; serviceName: string }[]);

        if (!date || !title || !phone || !supervisorId || !workMode || !equipment || !location || !creationCause) {
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
            workMode,
            equipment,
            location,
            creationCause,
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

        if (type !== 'toDecree' && type !== 'fromDecree') {
            throw new TRPCError({
                message: `Wrong request type ${request.type} instead of InternalEmployee for request with id ${id}`,
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
};
