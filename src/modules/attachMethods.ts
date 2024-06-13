import { Attach } from '@prisma/client';
import { TRPCError } from '@trpc/server';

import { prisma } from '../utils/prisma';

import { CreateAttach } from './attachTypes';
import { tr } from './modules.i18n';

export const attachMethods = {
    create: async (data: CreateAttach): Promise<Attach> => {
        return prisma.attach.create({ data });
    },

    getById: async (id: string) => {
        const attach = await prisma.attach.findFirst({
            where: { id },
        });

        if (attach === null) {
            throw new TRPCError({ code: 'NOT_FOUND', message: tr('Attach not found') });
        }

        return attach;
    },

    deleteAttach: async (id: string): Promise<Attach> => {
        await attachMethods.getById(id);

        return prisma.attach.update({ where: { id }, data: { deletedAt: new Date() } });
    },
};
