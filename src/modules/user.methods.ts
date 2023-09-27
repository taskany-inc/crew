import { User } from 'prisma/prisma-client';

import { prisma } from '../utils/prisma';

import { UserMembership } from './user.types';
import { AddUserToGroup, GetUserList, RemoveUserFromGroup } from './user.schemas';

export const userMethods = {
    addToGroup: (data: AddUserToGroup) => {
        return prisma.membership.create({ data });
    },

    removeFromGroup: (data: RemoveUserFromGroup) => {
        return prisma.membership.delete({ where: { userId_groupId: data } });
    },

    getById: (id: string) => {
        return prisma.user.findUniqueOrThrow({
            where: { id },
            include: { memberships: { include: { group: true, roles: true } } },
        });
    },

    getList: (data: GetUserList) => {
        return prisma.user.findMany({
            where: { name: { contains: data.search, mode: 'insensitive' } },
            take: data.take,
        });
    },

    getMemberships: (id: string): Promise<UserMembership[]> => {
        return prisma.membership.findMany({ where: { userId: id }, include: { group: true, user: true, roles: true } });
    },

    getGroupMembers: (groupId: string): Promise<User[]> => {
        return prisma.user.findMany({ where: { memberships: { some: { groupId } } } });
    },
};
