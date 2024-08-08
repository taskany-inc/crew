import { TRPCError } from '@trpc/server';

import { prisma } from '../utils/prisma';

import { tr } from './modules.i18n';
import { AddSupplementalPositionToUser, RemoveSupplementalPositionFromUser } from './supplementalPositionSchema';

export const supplementalPositionMethods = {
    addToUser: async (data: AddSupplementalPositionToUser) => {
        const supplementalPosition = await prisma.supplementalPosition.findFirst({
            where: { userId: data.userId, organizationUnitId: data.organizationUnitId },
            include: { user: true },
        });
        if (supplementalPosition) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: tr('User already has supplemental position in this organization'),
            });
        }
        return prisma.supplementalPosition.create({ data });
    },

    removeFromUser: async ({ id, userId }: RemoveSupplementalPositionFromUser) => {
        const result = await prisma.supplementalPosition.findUnique({ where: { id } });

        if (result?.userId !== userId) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: tr('User does not have supplemental position in this organization'),
            });
        }
        return prisma.supplementalPosition.delete({
            where: { id },
        });
    },
};
