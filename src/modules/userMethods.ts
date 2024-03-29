import { Prisma, User } from '@prisma/client';
import { TRPCError } from '@trpc/server';

import { prisma } from '../utils/prisma';
import { SessionUser } from '../utils/auth';
import { suggestionsTake } from '../utils/suggestions';
import { trimAndJoin } from '../utils/trimAndJoin';
import { config } from '../config';
import { defaultTake } from '../utils';

import {
    ExternalUserUpdate,
    MembershipInfo,
    UserAchievements,
    UserMemberships,
    UserMeta,
    UserSupervisor,
    UserSettings,
} from './userTypes';
import {
    AddUserToGroup,
    EditUser,
    EditUserSettings,
    GetUserList,
    RemoveUserFromGroup,
    GetUserSuggestions,
    CreateUser,
    EditUserActiveState,
} from './userSchemas';
import { userAccess } from './userAccess';
import { tr } from './modules.i18n';
import { addCalculatedGroupFields } from './groupMethods';

export const addCalculatedUserFields = <T extends User>(user: T, sessionUser: SessionUser): T & UserMeta => {
    return {
        ...user,
        bonusPoints: userAccess.isBonusViewable(sessionUser, user.id).allowed ? user.bonusPoints : 0,
        meta: {
            isEditable: userAccess.isEditable(sessionUser, user.id).allowed,
            isActiveStateEditable: userAccess.isActiveStateEditable(sessionUser).allowed,
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

    if (data.activeQuery !== undefined) {
        where.active = data.activeQuery;
    }

    return where;
};

const externalUserCreate = async (data: CreateUser) => {
    if (!config.externalUserService.apiToken || !config.externalUserService.apiUrlCreate) return;
    const { organizationUnitId, firstName, middleName, surname, phone, email, login } = data;
    const organization = await prisma.organizationUnit.findFirstOrThrow({
        where: { id: organizationUnitId },
    });
    const body = {
        firstName,
        middleName,
        surname,
        phone,
        email,
        organization,
        login,
    };
    const response = await fetch(config.externalUserService.apiUrlCreate, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
            authorization: config.externalUserService.apiToken,
        },
    });
    if (!response.ok) {
        const text = await response.text();
        throw new TRPCError({ code: 'BAD_REQUEST', message: text });
    }
};

const externalUserUpdate = async (userId: string, data: Omit<ExternalUserUpdate, 'email'>) => {
    if (!config.externalUserService.apiToken || !config.externalUserService.apiUrlUpdate) return;
    const user = await prisma.user.findFirstOrThrow({ where: { id: userId } });
    const fullData: ExternalUserUpdate = { email: user.email, ...data };
    const response = await fetch(config.externalUserService.apiUrlUpdate, {
        method: 'POST',
        body: JSON.stringify(fullData),
        headers: {
            'Content-Type': 'application/json',
            authorization: config.externalUserService.apiToken,
        },
    });
    if (!response.ok) {
        const text = await response.text();
        throw new TRPCError({ code: 'BAD_REQUEST', message: text });
    }
};

export const userMethods = {
    create: async (data: CreateUser) => {
        const [phoneService, loginService, accountingService] = await Promise.all([
            prisma.externalService.findUnique({ where: { name: 'Phone' } }),
            prisma.externalService.findUnique({ where: { name: 'Login' } }),
            prisma.externalService.findUnique({ where: { name: 'Accounting system' } }),
        ]);
        const servicesData = [];
        if (data.phone && phoneService) {
            servicesData.push({ serviceName: phoneService.name, serviceId: data.phone });
        }
        if (data.login && loginService) {
            servicesData.push({ serviceName: loginService.name, serviceId: data.login });
        }
        if (data.accountingId && accountingService) {
            servicesData.push({ serviceName: accountingService.name, serviceId: data.accountingId });
        }
        if (data.createExternalAccount) {
            await externalUserCreate(data);
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
        const membership = await prisma.membership.findUnique({
            where: { userId_groupId: { userId: data.userId, groupId: data.groupId } },
        });
        if (membership) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: tr('User is already a member of the group') });
        }
        const group = await prisma.group.findUnique({ where: { id: data.groupId } });
        if (!group) {
            throw new TRPCError({ code: 'NOT_FOUND', message: tr('No group with id {id}', { id: data.groupId }) });
        }
        if (group.organizational) {
            const orgMembership = await prisma.membership.findFirst({
                where: { userId: data.userId, group: { organizational: true } },
            });
            if (orgMembership) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: tr('User already has organizational membership') });
            }
        }
        const availablePercentage = await userMethods.getAvailableMembershipPercentage(data.userId);
        if (data.percentage && data.percentage > availablePercentage) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: tr('Maximum available percentage is {max}', { max: availablePercentage }),
            });
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
            data,
        });
    },

    getById: async (
        id: string,
        sessionUser: SessionUser,
    ): Promise<User & UserMeta & UserMemberships & UserSupervisor & UserAchievements> => {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                memberships: {
                    where: { archived: false },
                    include: { group: true, user: true, roles: true },
                    orderBy: { group: { name: 'asc' } },
                },
                supervisor: true,
                achievements: { include: { achievement: true } },
                settings: true,
            },
        });
        if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: `No user with id ${id}` });

        // TODO this should be in query https://github.com/taskany-inc/crew/issues/629
        const showAchievements =
            user.settings?.showAchievements || sessionUser.id === user.id || sessionUser.role === 'ADMIN';

        const userWithGroupMeta = {
            ...user,
            achievements: showAchievements ? user.achievements : undefined,
            memberships: user.memberships.map((m) => ({ ...m, group: addCalculatedGroupFields(m.group, sessionUser) })),
        };
        return addCalculatedUserFields(userWithGroupMeta, sessionUser);
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
        const { cursor, take, ...restData } = data;

        const where = usersWhere(restData);

        const counter = await prisma.user.count({ where });

        const total = await prisma.user.count({});

        if (!counter) {
            return {
                items: [],
                counter,
                total,
            };
        }

        const users = await prisma.user.findMany({
            where,
            take: (take || defaultTake) + 1,
            orderBy: { active: 'desc' },
            cursor: cursor ? { id: cursor } : undefined,
        });

        let nextCursor: typeof cursor | undefined;

        if (users.length > (take || defaultTake)) {
            const nextItem = users.pop();
            nextCursor = nextItem?.id;
        }

        return { users, total, nextCursor, counter };
    },

    getMemberships: async (id: string, sessionUser?: SessionUser): Promise<MembershipInfo[]> => {
        const memberships = await prisma.membership.findMany({
            where: { userId: id, archived: false },
            include: { group: true, user: true, roles: true },
        });
        return memberships.map((m) => ({ ...m, group: addCalculatedGroupFields(m.group, sessionUser) }));
    },

    getGroupMembers: (groupId: string): Promise<User[]> => {
        return prisma.user.findMany({ where: { memberships: { some: { groupId } }, active: { not: true } } });
    },

    edit: async (data: EditUser): Promise<User> => {
        await externalUserUpdate(data.id, { name: data.name, supervisorId: data.supervisorId });
        return prisma.user.update({
            where: { id: data.id },
            data: {
                name: data.name,
                supervisorId: data.supervisorId,
                title: data.title,
            },
        });
    },

    editActiveState: async (data: EditUserActiveState): Promise<User> => {
        await externalUserUpdate(data.id, { active: data.active });
        if (data.active === false) {
            await prisma.membership.deleteMany({ where: { userId: data.id, group: { organizational: true } } });
        }
        await prisma.membership.updateMany({ where: { userId: data.id }, data: { archived: !data.active } });
        return prisma.user.update({
            where: { id: data.id },
            data: { active: data.active, deactivatedAt: data.active ? null : new Date() },
        });
    },

    getAvailableMembershipPercentage: async (userId: string): Promise<number> => {
        const memberships = await prisma.membership.findMany({ where: { userId, percentage: { not: null } } });
        const total = memberships.reduce((prev, curr) => prev + (curr.percentage ?? 0), 0);
        return 100 - Math.min(Math.max(total, 0), 100);
    },

    suggestions: async ({ query, include, take = suggestionsTake }: GetUserSuggestions) => {
        const where: Prisma.UserWhereInput = {
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
            ],
            AND: [{ active: true }],
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
