import { UserCreationRequest, Prisma, User, PermissionService } from 'prisma/prisma-client';
import { TRPCError } from '@trpc/server';
import { ICalCalendarMethod } from 'ical-generator';

import { prisma } from '../utils/prisma';
import { trimAndJoin } from '../utils/trimAndJoin';
import { config } from '../config';
import {
    cancelUserCreationMailText,
    htmlUserCreationRequestWithDate,
    userCreationMailText,
} from '../utils/emailTemplates';
import { getOrgUnitTitle } from '../utils/organizationUnit';
import { createJob } from '../worker/create';
import { jobUpdate, jobDelete } from '../worker/jobOperations';
import { percentageMultiply } from '../utils/suplementPosition';

import { userMethods } from './userMethods';
import { calendarEvents, createIcalEventData, sendMail } from './nodemailer';
import { tr } from './modules.i18n';
import {
    CreateUserCreationRequest,
    EditUserCreationRequest,
    GetUserCreationRequestList,
    HandleUserCreationRequest,
} from './userCreationRequestSchemas';
import { CompleteUserCreationRequest, UserCreationRequestSupplementPosition } from './userCreationRequestTypes';

export const userCreationRequestsMethods = {
    create: async (
        data: CreateUserCreationRequest,
        sessionUserId: string,
    ): Promise<
        UserCreationRequest &
            UserCreationRequestSupplementPosition & { coordinators: User[] } & { lineManagers: User[] } & {
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
            prisma.externalService.findUnique({ where: { name: 'Phone' } }),
            prisma.externalService.findUnique({ where: { name: 'Accounting system' } }),
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
            date: data.date,
            comment: data.comment || undefined,
            workEmail: data.workEmail || undefined,
            personalEmail: data.personalEmail || undefined,
            attaches: data.attachIds?.length ? { connect: data.attachIds.map((id) => ({ id })) } : undefined,
            lineManagers: data.lineManagerIds?.length
                ? { connect: data.lineManagerIds?.map((id) => ({ id })) }
                : undefined,
        };

        if (data.supplementalPositions?.length && data.type === 'existing') {
            createData.supplementalPositions = {
                create: data.supplementalPositions.map(({ organizationUnitId, percentage, unitId }) => ({
                    organizationUnit: { connect: { id: organizationUnitId } },
                    percentage: percentage * percentageMultiply,
                    unitId,
                })),
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

            if (data.supplementalPositions?.length) {
                createData.supplementalPositions = {
                    create: data.supplementalPositions.map(({ organizationUnitId, percentage, unitId }) => ({
                        organizationUnit: { connect: { id: organizationUnitId } },
                        percentage: percentage * percentageMultiply,
                        unitId,
                    })),
                };
            }

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
            createData.percentage = data.percentage * percentageMultiply || undefined;
        }

        if (data.type === 'externalFromMainOrgEmployee') {
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

        const { to } = await userMethods.getMailingList('createUserRequest', data.organizationUnitId);

        const mailText = userCreationMailText(name);

        const subject = tr('New user request {userName}', { userName: name });

        sendMail({
            to,
            subject,
            text: mailText,
        });

        if (data.type === 'internalEmployee') {
            const { users, to: mailTo } = await userMethods.getMailingList(
                'createScheduledUserRequest',
                data.organizationUnitId,
                [sessionUserId],
            );

            const icalSubject = `${
                userCreationRequest.creationCause === 'transfer' ? tr('Transfer') : tr('Employment')
            } ${name} ${getOrgUnitTitle(
                userCreationRequest.organization,
            )} ${userCreationRequest.supplementalPositions.map(
                (o) => `${getOrgUnitTitle(o.organizationUnit)}(${o.percentage / percentageMultiply})`,
            )} ${data.phone}`;

            const icalEvent = createIcalEventData({
                id: userCreationRequest.id + config.nodemailer.authUser,
                start: data.date,
                duration: 30,
                users,
                summary: icalSubject,
                description: icalSubject,
            });

            const html = htmlUserCreationRequestWithDate({
                userCreationRequest,
                date: data.date,
            });
            sendMail({
                to: mailTo,
                subject: icalSubject,
                html,
                icalEvent: calendarEvents({
                    method: ICalCalendarMethod.REQUEST,
                    events: [icalEvent],
                }),
            });
        }

        return userCreationRequest;
    },

    getById: async (id: string) => {
        const request = await prisma.userCreationRequest.findUnique({ where: { id } });

        if (!request) {
            throw new TRPCError({ message: `No user creation request with id ${id}`, code: 'NOT_FOUND' });
        }

        return request;
    },

    edit: async (data: EditUserCreationRequest, requestBeforeUpdate: UserCreationRequest, sessionUserId: string) => {
        const { id, phone, ...restData } = data;

        if (requestBeforeUpdate.status === 'Denied') {
            throw new TRPCError({ code: 'FORBIDDEN', message: `Forbidden to edit denied request id: ${id}` });
        }

        restData.date && restData.date.setUTCHours(config.employmentUtcHour);

        const updateData: Prisma.UserCreationRequestUpdateInput = restData;
        const phoneService = await prisma.externalService.findUnique({ where: { name: 'Phone' } });

        const servicesBefore = requestBeforeUpdate.services as { serviceId: string; serviceName: string }[];
        const phoneBefore = servicesBefore.find((service) => service.serviceName === 'Phone')?.serviceId;

        if (phone && phoneBefore && phone !== phoneBefore) {
            const servicesAfter = servicesBefore.map((service) => {
                if (service.serviceName === phoneService?.name) {
                    return { serviceName: phoneService.name, serviceId: data.phone };
                }
                return service;
            });
            updateData.services = servicesAfter;
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
            },
        });

        if (restData.date && requestBeforeUpdate.date !== restData.date) {
            const { users, to: mailTo } = await userMethods.getMailingList(
                'createScheduledUserRequest',
                updatedRequest.organizationUnitId,
                [sessionUserId],
            );

            const icalSubject = `${updatedRequest.creationCause === 'transfer' ? tr('Transfer') : tr('Employment')} ${
                updatedRequest.name
            } ${getOrgUnitTitle(updatedRequest.organization)} ${phone}`;

            const icalEvent = createIcalEventData({
                id: updatedRequest.id + config.nodemailer.authUser,
                start: restData.date,
                duration: 30,
                users,
                summary: icalSubject,
                description: icalSubject,
            });

            const html = htmlUserCreationRequestWithDate({
                userCreationRequest: updatedRequest,
                date: restData.date,
            });
            sendMail({
                to: mailTo,
                subject: icalSubject,
                html,
                icalEvent: calendarEvents({
                    method: ICalCalendarMethod.REQUEST,
                    events: [icalEvent],
                }),
            });

            if (requestBeforeUpdate.jobId) await jobUpdate(requestBeforeUpdate.jobId, { date: restData.date });
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

        try {
            user = await userMethods.getByLogin(userCreationRequest.login);
        } catch (error) {
            /* empty */
        }

        if (user) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'User already exists' });
        }

        const acceptedRequest = await prisma.userCreationRequest.update({
            where: { id },
            data: { status: 'Approved', comment },
            include: { supervisor: true, organization: true, group: true },
        });

        if (userCreationRequest.date) {
            await createJob('createProfile', {
                data: { userCreationRequestId: userCreationRequest.id },
                date: userCreationRequest.date,
            });
        }

        return acceptedRequest as CompleteUserCreationRequest;
    },

    getList: async (data: GetUserCreationRequestList): Promise<CompleteUserCreationRequest[]> => {
        const where: Prisma.UserCreationRequestWhereInput = {};

        if (data.active) {
            where.status = null;
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
            orderBy: { date: 'desc' },
        });

        return requests as CompleteUserCreationRequest[];
    },

    cancel: async ({ id, comment }: HandleUserCreationRequest, sessionUserId: string) => {
        const canceledRequest = await prisma.userCreationRequest.update({
            where: { id },
            data: { status: 'Denied', comment },
            include: { organization: true, creator: true },
        });
        if (canceledRequest.jobId) await jobDelete(canceledRequest.jobId);

        if (canceledRequest.date) {
            const { users, to } = await userMethods.getMailingList(
                'createScheduledUserRequest',
                canceledRequest.organizationUnitId,
                [sessionUserId],
            );

            const text = cancelUserCreationMailText({
                name: canceledRequest.name,
                organization: getOrgUnitTitle(canceledRequest.organization),
                comment,
            });

            const subject = tr('Cancel user request {userName}', { userName: canceledRequest.name });

            const icalSublect = `
                ${tr('Cancellation of')} ${
                canceledRequest.creationCause === 'transfer' ? tr('transfer') : tr('employment')
            } ${canceledRequest.name} ${getOrgUnitTitle(canceledRequest.organization)}`;

            const icalEvent = createIcalEventData({
                id: canceledRequest.id + config.nodemailer.authUser,
                start: canceledRequest.date,
                duration: 30,
                users,
                summary: icalSublect,
                description: icalSublect,
            });

            sendMail({
                to,
                subject,
                text,
                icalEvent: calendarEvents({
                    method: ICalCalendarMethod.CANCEL,
                    events: [icalEvent],
                }),
            });
        }

        return canceledRequest;
    },
};
