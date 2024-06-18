import { Attach } from '@prisma/client';
import { TRPCError } from '@trpc/server';

import { prisma } from '../utils/prisma';
import { SessionUser } from '../utils/auth';

import { CreateAttach } from './attachTypes';
import { tr } from './modules.i18n';
import { removeFile } from './s3Methods';

export const attachMethods = {
    create: async (data: CreateAttach): Promise<Attach> => {
        return prisma.attach.create({ data });
    },

    getById: async (id: string, sessionUser: SessionUser) => {
        const attach = await prisma.attach.findFirst({
            where: { id },
        });

        if (attach === null) {
            throw new TRPCError({ code: 'NOT_FOUND', message: tr('Attach not found') });
        }

        if (
            attach.scheduledDeactivationId &&
            (!sessionUser.role?.editScheduledDeactivation || !sessionUser.role?.viewScheduledDeactivation)
        ) {
            throw new TRPCError({ code: 'FORBIDDEN', message: tr('Attach access forbidden') });
        }
        return attach;
    },

    deleteAttach: async (id: string, sessionUser: SessionUser): Promise<Attach> => {
        const attach = await attachMethods.getById(id, sessionUser);

        if (attach.scheduledDeactivationId && !sessionUser.role?.editScheduledDeactivation) {
            throw new TRPCError({ code: 'FORBIDDEN', message: tr('Attach deleting forbidden') });
        }

        try {
            await removeFile(attach.link);
        } catch (error) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: tr('Error occured while deleting attach'),
                cause: error,
            });
        }

        return prisma.attach.update({ where: { id }, data: { deletedAt: new Date() } });
    },
};
