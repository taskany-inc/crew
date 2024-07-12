import { TRPCError } from '@trpc/server';

import { prisma } from '../utils/prisma';
import { config } from '../config';

import { CreateUser } from './userSchemas';
import { ExternalUserUpdate } from './externalUserTypes';

export const externalUserMethods = {
    create: async (data: CreateUser) => {
        if (!config.externalUserService.apiToken || !config.externalUserService.apiUrlCreate) return;
        const { organizationUnitId, firstName, middleName, surname, phone, email, login } = data;
        const organization = await prisma.organizationUnit.findFirstOrThrow({
            where: { id: organizationUnitId },
            select: { country: true, name: true },
        });
        const body = {
            firstName,
            middleName,
            surname,
            phone,
            email,
            organization,
            login,
        };
        const response = await fetch(config.externalUserService.apiUrlCreate, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                authorization: config.externalUserService.apiToken,
            },
        });
        if (!response.ok) {
            const text = await response.text();
            throw new TRPCError({ code: 'BAD_REQUEST', message: text });
        }
    },

    update: async (userId: string, data: Omit<ExternalUserUpdate, 'email'>) => {
        if (!config.externalUserService.apiToken || !config.externalUserService.apiUrlUpdate) return;
        const user = await prisma.user.findFirstOrThrow({ where: { id: userId } });
        const fullData: ExternalUserUpdate = { email: user.email, ...data };
        const response = await fetch(config.externalUserService.apiUrlUpdate, {
            method: 'POST',
            body: JSON.stringify(fullData),
            headers: {
                'Content-Type': 'application/json',
                authorization: config.externalUserService.apiToken,
            },
        });
        if (!response.ok) {
            const text = await response.text();
            throw new TRPCError({ code: 'BAD_REQUEST', message: text });
        }
    },
};
