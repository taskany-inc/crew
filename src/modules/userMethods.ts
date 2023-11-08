import { BonusAction, Prisma, User } from 'prisma/prisma-client';
import { TRPCError } from '@trpc/server';

import { prisma } from '../utils/prisma';
import { SessionUser } from '../utils/auth';
import { suggestionsTake } from '../utils/suggestions';

import { MembershipInfo, UserMemberships, UserMeta, UserSettings, UserSupervisor } from './userTypes';
import {
    AddUserToGroup,
    ChangeBonusPoints,
    EditUser,
    EditUserSettings,
    GetUserList,
    RemoveUserFromGroup,
    GetUserSuggestions,
} from './userSchemas';
import { userAccess } from './userAccess';
import { tr } from './modules.i18n';

export const addCalculatedUserFields = <T extends User>(user: T, sessionUser: SessionUser): T & UserMeta => {
    return {
        ...user,
        meta: {
            isEditable: userAccess.isEditable(sessionUser, user.id).allowed,
            isBonusEditable: userAccess.isBonusEditable(sessionUser).allowed,
            isBonusHistoryViewable: userAccess.isBonusHistoryViewable(sessionUser, user.id).allowed,
        },
    };
};

const usersWhere = (data: GetUserList) => {
    const where: Prisma.UserWhereInput = {};
    if (data.search) where.name = { contains: data.search, mode: 'insensitive' };
    if (data.supervisorsQuery) where.supervisorId = { in: data.supervisorsQuery };
    if (data.groupsQuery && !data.rolesQuery) {
        where.memberships = {
            some: { groupId: { in: data.groupsQuery } },
        };
    }
    if (!data.groupsQuery && data.rolesQuery) {
        where.memberships = {
            some: { roles: { some: { id: { in: data.rolesQuery } } } },
        };
    }

    if (data.groupsQuery && data.rolesQuery) {
        where.memberships = {
            some: { groupId: { in: data.groupsQuery }, roles: { some: { id: { in: data.rolesQuery } } } },
        };
    }

    return where;
};

export const userMethods = {
    addToGroup: async (data: AddUserToGroup) => {
        const membership = await prisma.membership.findUnique({ where: { userId_groupId: data } });
        if (membership?.archived) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Cannot edit archived membership') });
        }
        return prisma.membership.create({ data });
    },

    removeFromGroup: async (data: RemoveUserFromGroup) => {
        const membership = await prisma.membership.findUnique({ where: { userId_groupId: data } });
        if (membership?.archived) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Cannot edit archived membership') });
        }
        return prisma.membership.delete({ where: { userId_groupId: data } });
    },

    editSettings: (userId: string, data: EditUserSettings) => {
        return prisma.userSettings.update({
            where: { userId },
            data: { theme: data.theme },
        });
    },

    changeBonusPoints: async (data: ChangeBonusPoints, sessionUser: SessionUser): Promise<User> => {
        const bonusPoints = data.action === BonusAction.ADD ? { increment: data.amount } : { decrement: data.amount };
        const [user] = await prisma.$transaction([
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

    getById: async (
        id: string,
        sessionUser: SessionUser,
    ): Promise<User & UserMeta & UserMemberships & UserSupervisor> => {
        const user = await prisma.user.findUniqueOrThrow({
            where: { id },
            include: {
                memberships: {
                    where: { archived: false },
                    include: { group: true, user: true, roles: true },
                    orderBy: { group: { name: 'asc' } },
                },
                supervisor: true,
            },
        });
        return addCalculatedUserFields(user, sessionUser);
    },

    getByEmail: (email: string) => {
        return prisma.user.findUniqueOrThrow({ where: { email } });
    },

    getSettings: async (id: string): Promise<UserSettings> => {
        const settings = (await prisma.userSettings.upsert({
            where: { userId: id },
            update: {},
            create: { userId: id },
        })) as UserSettings;
        return settings;
    },

    getList: async (data: GetUserList) => {
        const where = usersWhere(data);

        const counter = await prisma.user.count({ where });

        const total = await prisma.user.count({});

        const users = await prisma.user.findMany({
            where,
            take: data.take,
        });

        return { users, total, counter };
    },

    getMemberships: (id: string): Promise<MembershipInfo[]> => {
        return prisma.membership.findMany({
            where: { userId: id, archived: false },
            include: { group: true, user: true, roles: true },
        });
    },

    getGroupMembers: (groupId: string): Promise<User[]> => {
        return prisma.user.findMany({ where: { memberships: { some: { groupId } } } });
    },

    getBonusPointsHistory: (id: string) => {
        return prisma.bonusHistory.findMany({
            where: { targetUserId: id },
            orderBy: { createdAt: 'asc' },
        });
    },

    edit: (data: EditUser) => {
        return prisma.user.update({
            where: { id: data.id },
            data: { name: data.name, supervisorId: data.supervisorId },
        });
    },

    suggestions: async ({ query, include, take = suggestionsTake }: GetUserSuggestions) => {
        const where: Prisma.UserWhereInput = {
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
            ],
        };

        if (include) {
            where.id = { notIn: include };
        }
        const suggestions = await prisma.user.findMany({ where, take });

        if (include) {
            const includes = await prisma.user.findMany({ where: { id: { in: include } } });
            suggestions.push(...includes);
        }

        return suggestions;
    },
};
