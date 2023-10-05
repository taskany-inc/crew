import { BonusAction, User } from 'prisma/prisma-client';

import { prisma } from '../utils/prisma';
import { SessionUser } from '../utils/auth';

import { MembershipInfo, UserMemberships, UserMeta } from './user.types';
import { AddUserToGroup, ChangeBonusPoints, GetUserList, RemoveUserFromGroup } from './user.schemas';
import { userAccess } from './user.access';

export const addCalculatedUserFields = <T extends User>(user: T, sessionUser: SessionUser): T & UserMeta => {
    return {
        ...user,
        meta: {
            isEditable: userAccess.isEditable(sessionUser, user.id).allowed,
            isBalanceEditable: userAccess.isBalanceEditable(sessionUser).allowed,
        },
    };
};

export const userMethods = {
    addToGroup: (data: AddUserToGroup) => {
        return prisma.membership.create({ data });
    },

    removeFromGroup: (data: RemoveUserFromGroup) => {
        return prisma.membership.delete({ where: { userId_groupId: data } });
    },

    changeBonusPoints: async (data: ChangeBonusPoints, sessionUser: SessionUser): Promise<User> => {
        const bonusPoints = data.action === BonusAction.ADD ? { increment: data.amount } : { decrement: data.amount };
        const [user] = await Promise.all([
            prisma.user.update({ where: { id: data.userId }, data: { bonusPoints } }),
            prisma.bonusHistory.create({
                data: {
                    action: data.action,
                    amount: data.amount,
                    targetUserId: data.userId,
                    actingUserId: sessionUser.id,
                    description: data.description,
                },
            }),
        ]);
        return user;
    },

    getById: async (id: string, sessionUser: SessionUser): Promise<User & UserMeta & UserMemberships> => {
        const user = await prisma.user.findUniqueOrThrow({
            where: { id },
            include: { memberships: { include: { group: true, user: true, roles: true } } },
        });
        return addCalculatedUserFields(user, sessionUser);
    },

    getList: (data: GetUserList) => {
        return prisma.user.findMany({
            where: { name: { contains: data.search, mode: 'insensitive' } },
            take: data.take,
        });
    },

    getMemberships: (id: string): Promise<MembershipInfo[]> => {
        return prisma.membership.findMany({ where: { userId: id }, include: { group: true, user: true, roles: true } });
    },

    getGroupMembers: (groupId: string): Promise<User[]> => {
        return prisma.user.findMany({ where: { memberships: { some: { groupId } } } });
    },
};
