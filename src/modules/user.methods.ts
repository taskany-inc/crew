import { User } from 'prisma/prisma-client';

import { prisma } from '../utils/prisma';

import { UserMembership } from './user.types';
import { AddUserToGroup } from './user.schemas';

export const userMethods = {
    addToGroup: (data: AddUserToGroup) => {
        return prisma.membership.create({ data });
    },

    getById: (id: string) => {
        return prisma.user.findUniqueOrThrow({
            where: { id },
            include: { memberships: { include: { group: true, roles: true } } },
        });
    },

    getMemberships: (id: string): Promise<UserMembership[]> => {
        return prisma.membership.findMany({ where: { userId: id }, include: { group: true, roles: true } });
    },

    getGroupMembers: (groupId: string): Promise<User[]> => {
        return prisma.user.findMany({ where: { memberships: { some: { groupId } } } });
    },
};
