import { Prisma, User } from '@prisma/client';
import { TRPCError } from '@trpc/server';

import { prisma } from '../utils/prisma';
import { SessionUser } from '../utils/auth';
import { suggestionsTake } from '../utils/suggestions';
import { trimAndJoin } from '../utils/trimAndJoin';
import { config } from '../config';
import { defaultTake } from '../utils';
import { getCorporateEmail } from '../utils/getCorporateEmail';

import {
    ExternalUserUpdate,
    MembershipInfo,
    UserAchievements,
    UserMemberships,
    UserSupervisor,
    UserSettings,
    UserSupervisorOf,
    UserSupervisorIn,
    UserMeta,
    UserOrganizationUnit,
} from './userTypes';
import {
    AddUserToGroup,
    EditUserSettings,
    GetUserList,
    RemoveUserFromGroup,
    GetUserSuggestions,
    CreateUser,
    EditUserActiveState,
    GetUserByField,
    EditUserFields,
    UserRestApiData,
} from './userSchemas';
import { tr } from './modules.i18n';
import { addCalculatedGroupFields } from './groupMethods';
import { userAccess } from './userAccess';

export const addCalculatedUserFields = <T extends User>(user: T, sessionUser?: SessionUser): T & UserMeta => {
    if (!sessionUser) {
        return {
            ...user,
            meta: {
                isEditable: false,
                isActivityViewable: false,
            },
        };
    }
    return {
        ...user,
        meta: {
            isEditable: userAccess.isEditable(sessionUser, user.id).allowed,
            isActivityViewable: userAccess.isActivityViewable(sessionUser, user.id).allowed,
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
    getByIdOrThrow: async (id: string): Promise<User> => {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: `No user with id ${id}` });
        return user;
    },

    create: async (data: CreateUser) => {
        const [phoneService, accountingService] = await Promise.all([
            prisma.externalService.findUnique({ where: { name: 'Phone' } }),
            prisma.externalService.findUnique({ where: { name: 'Accounting system' } }),
        ]);
        const servicesData = [];
        if (data.phone && phoneService) {
            servicesData.push({ serviceName: phoneService.name, serviceId: data.phone });
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
                login: data.login,
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

    getByLogin: async (login: string, sessionUser?: SessionUser) => {
        const user = await prisma.user.findUnique({ where: { login }, select: { id: true } });

        if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: `No user with login ${login}` });

        return userMethods.getById(user.id, sessionUser);
    },

    getById: async (
        id: string,
        sessionUser?: SessionUser,
    ): Promise<
        User &
            UserMeta &
            UserMemberships &
            UserSupervisor &
            UserAchievements &
            UserSupervisorOf &
            UserSupervisorIn &
            UserOrganizationUnit
    > => {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                memberships: {
                    where: { archived: false },
                    include: { group: true, user: true, roles: true },
                    orderBy: { group: { name: 'asc' } },
                },
                supervisor: true,
                achievements: { include: { achievement: true }, where: { achievement: { hidden: false } } },
                settings: true,
                supervisorOf: { where: { active: true } },
                supervisorIn: { where: { archived: false } },
                organizationUnit: true,
                groupAdmins: true,
            },
        });
        if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: `No user with id ${id}` });

        // TODO this should be in query https://github.com/taskany-inc/crew/issues/629
        const showAchievements =
            user.settings?.showAchievements ||
            sessionUser?.id === user.id ||
            sessionUser?.role?.editUserAchievements ||
            sessionUser?.role?.viewUserExtendedInfo;

        const userWithGroupMeta = {
            ...user,
            achievements: showAchievements ? user.achievements : undefined,
            memberships: await Promise.all(
                user.memberships.map(async (m) => ({
                    ...m,
                    group: await addCalculatedGroupFields(m.group, sessionUser),
                })),
            ),
        };
        return addCalculatedUserFields(userWithGroupMeta, sessionUser);
    },

    getUserByField: async (data: GetUserByField) => {
        const where: Prisma.UserWhereInput = {
            id: data.id,
            email: data.email,
            login: data.login,
            services:
                data.serviceName && data.serviceId
                    ? { some: { serviceName: data.serviceName, serviceId: data.serviceId } }
                    : undefined,
        };
        const user = await prisma.user.findFirst({ where });
        if (!user) {
            throw new TRPCError({ code: 'NOT_FOUND', message: `Cannot find user by ${JSON.stringify(data)}` });
        }
        return user;
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

        return Promise.all(
            memberships.map(async (m) => ({ ...m, group: await addCalculatedGroupFields(m.group, sessionUser) })),
        );
    },

    getGroupMembers: (groupId: string): Promise<User[]> => {
        return prisma.user.findMany({ where: { memberships: { some: { groupId } }, active: { not: true } } });
    },

    edit: async (data: EditUserFields) => {
        if (data.organizationUnitId) {
            const newOrganization = await prisma.organizationUnit.findUnique({
                where: {
                    id: data.organizationUnitId,
                },
            });

            if (!newOrganization) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `No organization with id ${data.organizationUnitId}`,
                });
            }
        }

        await externalUserUpdate(data.id, { name: data.name, supervisorId: data.supervisorId });
        return prisma.user.update({
            where: { id: data.id },
            data,
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

    getUserDataForRestApi: async (data: GetUserByField): Promise<UserRestApiData> => {
        const { id: userId } = await userMethods.getUserByField(data);
        const user = await userMethods.getById(userId);
        const [surname, firstName, middleName] = (user.name || '').split(' ');

        const serviceNumberService = await prisma.userService.findFirst({
            where: {
                userId: user.id,
                serviceName: 'ServiceNumber',
                organizationUnitId: user.organizationUnitId ?? undefined,
            },
        });

        const [phoneService, accountingService] = await Promise.all([
            prisma.userService.findFirst({
                where: {
                    userId: user.id,
                    serviceName: 'Phone',
                },
            }),
            prisma.userService.findFirst({
                where: {
                    userId: user.id,
                    serviceName: 'AccountingId',
                },
            }),
        ]);

        return {
            ...user,
            id: user.id,
            surname,
            firstName,
            middleName,
            registrationEmail: user.email,
            corporateEmail: getCorporateEmail(user.login),
            phone: phoneService?.serviceId,
            login: user.login,
            serviceNumber: serviceNumberService?.serviceId,
            accountingId: accountingService?.serviceId,
            organizationUnitId: user.organizationUnitId,
            groups: user.memberships.map((m) => ({
                id: m.groupId,
                name: m.group.name,
                roles: m.roles.map((r) => r.name),
            })),
            supervisorLogin: user.supervisor?.login,
            active: user.active,
        };
    },
};
