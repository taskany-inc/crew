import { TRPCError } from '@trpc/server';

import { prisma } from '../utils/prisma';
import { config } from '../config';
import { logger } from '../utils/logger';

import { CreateUser } from './userSchemas';
import { ExternalUserUpdate } from './externalUserTypes';

export const externalUserMethods = {
    create: async (data: CreateUser) => {
        if (!config.externalUserService.enabled) return;
        if (!config.externalUserService.apiToken || !config.externalUserService.apiUrlCreate) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'External user service is not configured' });
        }
        const { organizationUnitId, firstName, middleName, surname, phone, workMail, personalMail, login, isExternal } =
            data;
        const organization = await prisma.organizationUnit.findFirstOrThrow({
            where: { id: organizationUnitId },
            select: { country: true, name: true },
        });
        const body = {
            firstName,
            middleName,
            surname,
            phone,
            workMail,
            personalMail,
            organization,
            login,
            isExternal,
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
            logger.error(response.text, 'Failed to create external user');
            throw new TRPCError({ code: 'BAD_REQUEST', message: text });
        }
    },

    update: async (userId: string, data: Omit<ExternalUserUpdate, 'email'>) => {
        if (!config.externalUserService.enabled) return;
        if (!config.externalUserService.apiToken || !config.externalUserService.apiUrlUpdate) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'External user service is not configured' });
        }
        const user = await prisma.user.findFirstOrThrow({ where: { id: userId } });
        const fullData: ExternalUserUpdate = { email: user.email, login: user.login || undefined, ...data };
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
            logger.error(response.text, 'Failed to update external user');
            throw new TRPCError({ code: 'BAD_REQUEST', message: text });
        }
    },
};
