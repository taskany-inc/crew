import { UserCreationRequest, Prisma } from 'prisma/prisma-client';
import { TRPCError } from '@trpc/server';
import { ICalCalendarMethod } from 'ical-generator';

import { prisma } from '../utils/prisma';
import { trimAndJoin } from '../utils/trimAndJoin';
import { config } from '../config';
import { htmlUserCreationRequestWithDate, userCreationMailText } from '../utils/emailTemplates';
import { getOrgUnitTitle } from '../utils/organizationUnit';
import { createJob } from '../utils/worker/create';

import { userMethods } from './userMethods';
import { calendarEvents, createIcalEventData, sendMail } from './nodemailer';
import { tr } from './modules.i18n';
import {
    CreateUserCreationRequest,
    GetUserCreationRequestList,
    HandleUserCreationRequest,
} from './userCreationRequestSchemas';
import { CompleteUserCreationRequest } from './userCreationRequestTypes';

export const userCreationRequestsMethods = {
    create: async (data: CreateUserCreationRequest, sessionUserId: string): Promise<UserCreationRequest> => {
        const name = trimAndJoin([data.surname, data.firstName, data.middleName]);

        const isLoginUnique = await userMethods.isLoginUnique(data.login);

        if (isLoginUnique === false) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: tr('User with login {login} already exist', { login: data.login }),
            });
        }

        const supervisor = await prisma.user.findUniqueOrThrow({ where: { id: data.supervisorId ?? undefined } });

        if (!supervisor.login) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Supervisor has no login' });
        }

        if (!data.groupId) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Group is required' });
        }
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
            groupId: data.groupId,
            supervisorLogin: supervisor.login,
            title: data.title || undefined,
            corporateEmail: data.corporateEmail || undefined,
            osPreference: data.osPreference || undefined,
            createExternalAccount: Boolean(data.createExternalAccount),
            services: {
                toJSON: () => servicesData,
            },
            date: data.date,
            comment: data.comment,
            attaches: data.attachIds ? { connect: data.attachIds.map((id) => ({ id })) } : undefined,
        };

        if (data.type === 'externalEmployee') {
            if (!organizationUnit?.external) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Cannot create external user in internal organization',
                });
            }

            createData.externalOrganizationSupervisorLogin = data.externalOrganizationSupervisorLogin || undefined;
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

            if (buddy && !buddy.login) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Buddy has no login' });
            }
            const coordinator = data.coordinatorId
                ? await prisma.user.findUniqueOrThrow({ where: { id: data.coordinatorId ?? undefined } })
                : undefined;

            if (coordinator && !coordinator.login) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Coordinator has no login' });
            }

            const recruiter = data.recruiterId
                ? await prisma.user.findUniqueOrThrow({ where: { id: data.recruiterId ?? undefined } })
                : undefined;

            if (recruiter && !recruiter.login) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Recruiter has no login' });
            }
            createData.workMode = data.workMode || undefined;
            createData.workModeComment = data.workModeComment || undefined;
            createData.equipment = data.equipment || undefined;
            createData.extraEquipment = data.extraEquipment || undefined;
            createData.workSpace = data.workSpace || undefined;
            createData.buddyLogin = buddy?.login || undefined;
            createData.coordinatorLogin = coordinator?.login || undefined;
            createData.recruiterLogin = recruiter?.login || undefined;
            createData.location = data.location || undefined;
            createData.creationCause = data.creationCause || undefined;
            createData.unitId = data.unitId || undefined;
        }

        const userCreationRequest = await prisma.userCreationRequest.create({
            data: createData,
            include: {
                group: true,
                organization: true,
                supervisor: true,
                buddy: true,
                coordinator: true,
                recruiter: true,
                creator: true,
            },
        });

        const { to } = await userMethods.getMailingList('createUserRequest');

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
                userCreationRequest.creator ? userCreationRequest.creator : undefined,
            );

            const icalSublect = `${
                userCreationRequest.creationCause === 'transfer' ? tr('Transfer') : tr('Employment')
            } ${name} ${getOrgUnitTitle(userCreationRequest.organization)} ${data.phone}`;

            const icalEvent = createIcalEventData({
                id: userCreationRequest.id + config.nodemailer.authUser,
                start: data.date,
                duration: 30,
                users,
                summary: icalSublect,
                description: icalSublect,
            });

            const html = htmlUserCreationRequestWithDate({
                userCreationRequest,
                date: data.date,
                firstName: data.firstName,
                surname: data.surname,
                middleName: data.middleName,
            });
            sendMail({
                to: mailTo,
                subject: icalSublect,
                html,
                icalEvent: calendarEvents({
                    method: ICalCalendarMethod.REQUEST,
                    events: [icalEvent],
                }),
            });
        }

        return userCreationRequest;
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
                recruiter: true,
            },
        });

        return requests as CompleteUserCreationRequest[];
    },
};
