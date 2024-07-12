import { User, UserCreationRequest } from 'prisma/prisma-client';
import { TRPCError } from '@trpc/server';

import { prisma } from '../utils/prisma';
import { trimAndJoin } from '../utils/trimAndJoin';
import { userCreationMailText } from '../utils/emailTemplates';

import { userMethods } from './userMethods';
import { sendMail } from './nodemailer';
import { tr } from './modules.i18n';
import { CreateUserCreationRequest, HandleUserCreationRequest } from './userCreationRequestSchemas';
import { externalUserMethods } from './externalUserMethods';
import { FullyUserCreationRequest } from './userCreationRequestTypes';

export const userCreationRequestsMethods = {
    create: async (data: CreateUserCreationRequest): Promise<UserCreationRequest> => {
        const name = trimAndJoin([data.surname, data.firstName, data.middleName]);

        const supervisor = await prisma.user.findUniqueOrThrow({ where: { id: data.supervisorId ?? undefined } });

        if (!supervisor.login) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Supervisor has no login' });
        }

        if (!data.groupId) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Group is required' });
        }

        const [phoneService, accountingService] = await Promise.all([
            prisma.externalService.findUnique({ where: { name: 'Phone' } }),
            prisma.externalService.findUnique({ where: { name: 'Accounting system' } }),
        ]);

        const servicesData: { serviceName: string; serviceId: string }[] = [];
        if (phoneService) {
            servicesData.push({ serviceName: phoneService.name, serviceId: data.phone });
        }
        if (accountingService) {
            servicesData.push({ serviceName: accountingService.name, serviceId: data.accountingId });
        }

        const userCreationRequest = await prisma.userCreationRequest.create({
            data: {
                name,
                supervisorLogin: supervisor.login,
                email: data.email,
                corporateEmail: data.corporateEmail || undefined,
                title: data.title || undefined,
                osPreference: data.osPreference || undefined,
                login: data.login,
                organizationUnitId: data.organizationUnitId,
                groupId: data.groupId,
                createExternalAccount: Boolean(data.createExternalAccount),
                services: {
                    toJSON: () => servicesData,
                },
                date: data.date,
            },
            include: { group: true, organization: true, supervisor: true },
        });

        const { to } = await userMethods.getMailingList('createUserRequest');

        const mailText = userCreationMailText(name);

        const subject = tr('New user request {userName}', { userName: name });

        sendMail({
            to,
            subject,
            text: mailText,
        });

        return userCreationRequest;
    },

    decline: async ({ id, comment }: HandleUserCreationRequest): Promise<UserCreationRequest> => {
        return prisma.userCreationRequest.update({
            where: { id },
            data: { status: 'Denied', comment },
        });
    },

    accept: async ({
        id,
        comment,
    }: HandleUserCreationRequest): Promise<{
        newUser: User;
        acceptedRequest: FullyUserCreationRequest;
    }> => {
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

        const services = userCreationRequest.services as { serviceId: string; serviceName: string }[];

        const email = userCreationRequest.corporateEmail || userCreationRequest.email;

        if (userCreationRequest.createExternalAccount) {
            const [surname, firstName, middleName] = userCreationRequest.name.split(' ');

            const phone = services.find((service) => service.serviceName === 'Phone')?.serviceId;

            if (!phone) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Phone service is required' });
            }

            await externalUserMethods.create({
                surname,
                firstName,
                middleName,
                email,
                phone,
                login: userCreationRequest.login,
                organizationUnitId: userCreationRequest.organizationUnitId,
            });
        }

        const acceptedRequest = await prisma.userCreationRequest.update({
            where: { id },
            data: { status: 'Approved', comment },
            include: { supervisor: true, organization: true, group: true },
        });

        if (acceptedRequest.corporateEmail) {
            const emailService = await prisma.externalService.findUnique({ where: { name: 'Email' } });
            if (!emailService) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Email service not found' });
            services.push({ serviceName: emailService.name, serviceId: acceptedRequest.email });
        }

        const newUser = await prisma.user.create({
            data: {
                name: acceptedRequest.name,
                email: acceptedRequest.email,
                supervisorId: acceptedRequest.supervisor.id,
                login: acceptedRequest.login,
                title: userCreationRequest.title,
                memberships: { create: { groupId: acceptedRequest.groupId } },
                organizationUnitId: acceptedRequest.organizationUnitId,
                services: { createMany: { data: services } },
                workStartDate: acceptedRequest.date,
            },
        });

        return {
            newUser,
            acceptedRequest: acceptedRequest as FullyUserCreationRequest,
        };
    },

    getList: async (): Promise<FullyUserCreationRequest[]> => {
        const requests = await prisma.userCreationRequest.findMany({
            where: {
                status: null,
            },
            include: {
                group: true,
                organization: true,
                supervisor: true,
            },
        });

        return requests as FullyUserCreationRequest[];
    },
};
