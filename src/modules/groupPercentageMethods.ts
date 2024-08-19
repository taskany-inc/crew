import { TRPCError } from '@trpc/server';

import { prisma } from '../utils/prisma';

import { UpdateMembershipPercentage } from './percentageSchemas';
import { tr } from './modules.i18n';
import { userMethods } from './userMethods';

export const groupPercentageMethods = {
    update: async ({ membershipId, percentage }: UpdateMembershipPercentage) => {
        const membership = await prisma.membership.findUnique({ where: { id: membershipId } });
        if (membership?.archived) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Cannot edit archived membership') });
        }

        if (!membership) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Cannot edit non-existent membership') });
        }

        const availablePercentage = await userMethods.getAvailableMembershipPercentage(membership.userId);
        if (percentage && percentage > availablePercentage) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: tr('Maximum available percentage is {max}', { max: availablePercentage }),
            });
        }

        return prisma.membership.update({
            where: { id: membershipId, archived: false },
            data: { percentage },
        });
    },
};
