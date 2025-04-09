import { TRPCError } from '@trpc/server';

import { prisma } from '../utils/prisma';
import { config } from '../config';
import { logger } from '../utils/logger';

import { CreateUser } from './userSchemas';
import { ExternalUserUpdate } from './externalUserTypes';
import { historyEventMethods } from './historyEventMethods';

const externalUserLogger = logger.child({ externalUserMethods: true });

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
        const text = await response.text();
        if (!response.ok) {
            externalUserLogger.error({ response: text, data }, 'Failed to create external user');
        } else {
            externalUserLogger.info({ response: text, data }, 'Successfully created external user');
        }
        await historyEventMethods.create({ subsystem: 'External user methods' }, 'externalUserCreate', {
            groupId: undefined,
            userId: undefined,
            before: undefined,
            after: { success: response.ok, response: text, ...body, organization: body.organization.name },
        });
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
        const text = await response.text();
        if (!response.ok) {
            externalUserLogger.error({ response: text, userId, data }, 'Failed to update external user');
        } else {
            externalUserLogger.info({ response: text, userId, data }, 'Successfully updated external user');
        }
        await historyEventMethods.create({ subsystem: 'External user methods' }, 'externalUserUpdate', {
            groupId: undefined,
            userId,
            before: { success: response.ok, response: text, name: user.name ?? undefined, active: user.active },
            after: { success: response.ok, response: text, name: data.name, active: data.active },
        });
    },
};
