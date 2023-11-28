import { Prisma, User } from 'prisma/prisma-client';
import { TRPCError } from '@trpc/server';

import { prisma } from '../utils/prisma';
import { SessionUser } from '../utils/auth';
import { suggestionsTake } from '../utils/suggestions';
import { trimAndJoin } from '../utils/trimAndJoin';

import { MembershipInfo, UserMemberships, UserMeta, UserSettings, UserSupervisor } from './userTypes';
import {
    AddUserToGroup,
    EditUser,
    EditUserSettings,
    GetUserList,
    RemoveUserFromGroup,
    GetUserSuggestions,
    CreateUser,
} from './userSchemas';
import { userAccess } from './userAccess';
import { tr } from './modules.i18n';

export const addCalculatedUserFields = <T extends User>(user: T, sessionUser: SessionUser): T & UserMeta => {
    return {
        ...user,
        meta: {
            isEditable: userAccess.isEditable(sessionUser, user.id).allowed,
            isBonusEditable: userAccess.isBonusEditable(sessionUser).allowed,
            isBonusViewable: userAccess.isBonusViewable(sessionUser, user.id).allowed,
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
    create: async (data: CreateUser) => {
        const [phoneService, loginService] = await Promise.all([
            prisma.externalService.findUnique({ where: { name: 'Phone' } }),
            prisma.externalService.findUnique({ where: { name: 'Login' } }),
        ]);
        const servicesData = [];
        if (data.phone && phoneService) {
            servicesData.push({ serviceName: phoneService.name, serviceId: data.phone });
        }
        if (data.login && loginService) {
            servicesData.push({ serviceName: loginService.name, serviceId: data.login });
        }
        return prisma.user.create({
            data: {
                name: trimAndJoin([data.surname, data.firstName, data.middleName]),
                email: data.email,
                supervisorId: data.supervisorId,
                memberships: data.groupId ? { create: { groupId: data.groupId } } : undefined,
                organizationUnitId: data.organizationUnitId,
                services: { createMany: { data: servicesData } },
            },
        });
    },

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
