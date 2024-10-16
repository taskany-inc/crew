import { Prisma, User } from '@prisma/client';
import { TRPCError } from '@trpc/server';

import { prisma } from '../utils/prisma';
import { SessionUser } from '../utils/auth';
import { suggestionsTake } from '../utils/suggestions';
import { trimAndJoin } from '../utils/trimAndJoin';
import { defaultTake } from '../utils';
import { getCorporateEmail } from '../utils/getCorporateEmail';

import {
    MembershipInfo,
    UserAchievements,
    UserMemberships,
    UserSupervisor,
    UserSettings,
    UserSupervisorOf,
    UserSupervisorIn,
    UserMeta,
    UserOrganizationUnit,
    UserRoleData,
    MailingSettingType,
    UserScheduledDeactivations,
    UserSupplementalPositions,
    UserNames,
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
    EditUserRoleData,
    EditUserMailingSettings,
    UpdateMembershipPercentage,
} from './userSchemas';
import { tr } from './modules.i18n';
import { addCalculatedGroupFields, groupMethods } from './groupMethods';
import { userAccess } from './userAccess';
import { externalUserMethods } from './externalUserMethods';
import { supplementalPositionMethods } from './supplementalPositionMethods';

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

const usersWhere = async (data: GetUserList) => {
    const OR: Prisma.UserWhereInput[] = [];
    const AND: Prisma.UserWhereInput[] = [];
    const membershipsSome: Prisma.MembershipWhereInput = {};
    if (data.search) {
        OR.push({ name: { contains: data.search, mode: 'insensitive' } });
        OR.push({ otherNames: { some: { name: { contains: data.search, mode: 'insensitive' } } } });
    }
    if (data.supervisors) AND.push({ supervisorId: { in: data.supervisors } });
    if (data.groups) {
        let groupIds = [...data.groups];
        if (data.includeChildrenGroups) {
            groupIds = await groupMethods.getDeepChildrenIds(groupIds);
        }
        membershipsSome.groupId = { in: groupIds };
    }
    if (data.roles) {
        membershipsSome.roles = { some: { id: { in: data.roles } } };
    }

    if (data.active !== undefined) {
        AND.push({ active: data.active });
    }

    if (data.mailingSettings) {
        AND.push({
            mailingSettings: {
                some: {
                    [data.mailingSettings.type]: true,
                    organizationUnitId: data.mailingSettings.organizationUnitId,
                },
            },
        });
    }

    if (data.groups || data.roles) {
        AND.push({ memberships: { some: membershipsSome } });
    }

    const where: Prisma.UserWhereInput = { OR: OR.length ? OR : undefined, AND: AND.length ? AND : undefined };
    return where;
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
            await externalUserMethods.create(data);
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

    updatePercentage: async ({ membershipId, percentage }: UpdateMembershipPercentage) => {
        const membership = await prisma.membership.findUnique({ where: { id: membershipId } });
        if (membership?.archived) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Cannot edit archived membership') });
        }

        if (!membership) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: tr('Cannot edit non-existent membership') });
        }

        const availablePercentage = await userMethods.getAvailableMembershipPercentage(membership.userId);
        const max = Math.min(100, availablePercentage + Number(membership.percentage));
        if (percentage && percentage > max) {
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

    editMailingSettings: async ({ userId, type, value, organizationUnitId }: EditUserMailingSettings) => {
        const settings = await prisma.mailingSettings.findFirst({ where: { userId, organizationUnitId } });

        if (settings) {
            return prisma.mailingSettings.update({ where: { id: settings.id }, data: { [type]: value } });
        }
        return prisma.mailingSettings.create({
            data: {
                user: { connect: { id: userId } },
                organizationUnit: { connect: { id: organizationUnitId } },
                [type]: value,
            },
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
            UserNames &
            UserMemberships &
            UserSupervisor &
            UserAchievements &
            UserSupervisorOf &
            UserSupervisorIn &
            UserOrganizationUnit &
            UserRoleData &
            UserScheduledDeactivations &
            UserSupplementalPositions
    > => {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                otherNames: { select: { name: true } },
                memberships: {
                    where: { archived: false },
                    include: {
                        group: true,
                        roles: true,
                        user: {
                            include: {
                                organizationUnit: true,
                            },
                        },
                    },
                    orderBy: { group: { name: 'asc' } },
                },
                supervisor: true,
                achievements: { include: { achievement: true }, where: { achievement: { hidden: false } } },
                settings: true,
                supervisorOf: { where: { active: true } },
                supervisorIn: { where: { archived: false } },
                organizationUnit: true,
                groupAdmins: true,
                role: true,
                scheduledDeactivations: {
                    orderBy: { createdAt: 'desc' },
                    include: { organizationUnit: true, newOrganizationUnit: true, attaches: true },
                },
                supplementalPositions: { include: { organizationUnit: true } },
            },
        });
        if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: `No user with id ${id}` });

        const showAchievements = user.settings ? user.settings.showAchievements : true;

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

        const where = await usersWhere(restData);

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
            include: {
                group: true,
                roles: true,
                user: {
                    include: {
                        organizationUnit: true,
                    },
                },
            },
        });

        return Promise.all(
            memberships.map(async (m) => ({ ...m, group: await addCalculatedGroupFields(m.group, sessionUser) })),
        );
    },

    getGroupMembers: (groupId: string): Promise<User[]> => {
        return prisma.user.findMany({ where: { memberships: { some: { groupId } }, active: { not: true } } });
    },

    edit: async ({ id, savePreviousName, supplementalPosition, ...data }: EditUserFields) => {
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

        if (supplementalPosition) {
            const supplementalOrganization = await prisma.organizationUnit.findUnique({
                where: {
                    id: supplementalPosition.organizationUnitId,
                },
            });

            if (!supplementalOrganization) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `No organization with id ${supplementalPosition.organizationUnitId}`,
                });
            }

            await supplementalPositionMethods.addToUser({ userId: id, ...supplementalPosition });
        }

        await externalUserMethods.update(id, { name: data.name, supervisorId: data.supervisorId });

        if (savePreviousName) {
            const userBeforeUpdate = await userMethods.getByIdOrThrow(id);
            if (userBeforeUpdate.name) {
                await prisma.userNames.create({ data: { userId: id, name: userBeforeUpdate.name } });
            }
        }

        return prisma.user.update({ where: { id }, data });
    },

    editActiveState: async (data: EditUserActiveState): Promise<User> => {
        await externalUserMethods.update(data.id, { active: data.active });
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
                { otherNames: { some: { name: { contains: query, mode: 'insensitive' } } } },
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

    editUserRole: async ({ id, roleCode }: EditUserRoleData) => {
        return prisma.user.update({
            where: { id },
            data: { roleCode },
        });
    },

    getMailingList: async (
        mailingType: MailingSettingType,
        organizationUnitId: string,
        additionUsersIds?: string[],
    ) => {
        const mailingList = await prisma.user.findMany({
            where: {
                OR: [
                    { mailingSettings: { some: { [mailingType]: true, organizationUnitId } }, active: true },
                    { id: { in: additionUsersIds } },
                ],
            },
            select: { email: true, name: true },
        });
        const users = mailingList.map(({ email, name }) => ({ email, name: name || undefined }));

        const to = users.map(({ email }) => email);

        return { users, to };
    },

    isLoginUnique: async (login: string) => {
        const countUserLogins = await prisma.user.count({ where: { login } });

        const countUserRequestLogins = await prisma.userCreationRequest.count({
            where: {
                OR: [
                    {
                        status: {
                            not: 'Denied',
                        },
                    },
                    {
                        status: {
                            equals: null,
                        },
                    },
                ],
                AND: [{ login }],
            },
        });

        return countUserLogins + countUserRequestLogins === 0;
    },

    createUserFromRequest: async (userCreationRequestId: string) => {
        const request = await prisma.userCreationRequest.findUnique({
            where: { id: userCreationRequestId },
            include: { supplementalPositions: true },
        });

        if (!request) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: `No user creation request by id ${userCreationRequestId}`,
            });
        }

        if (request.status !== 'Approved') {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Request was not accepted' });
        }

        const services = request.services as { serviceId: string; serviceName: string }[];

        if (request.corporateEmail && !request.email) {
            const emailService = await prisma.externalService.findUnique({ where: { name: 'Email' } });
            if (!emailService) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Email service not found' });
            services.push({ serviceName: emailService.name, serviceId: request.email });
        }

        if (request.personalEmail) {
            const emailService = await prisma.externalService.findUnique({ where: { name: 'Email' } });
            if (!emailService) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Email service not found' });
            services.push({ serviceName: emailService.name, serviceId: request.personalEmail });
        }

        if (request.workEmail) {
            const emailService = await prisma.externalService.findUnique({ where: { name: 'Email' } });
            if (!emailService) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Email service not found' });
            services.push({ serviceName: emailService.name, serviceId: request.workEmail });
        }

        if (request.createExternalAccount) {
            const [surname, firstName, middleName] = request.name.split(' ');

            const email = request.corporateEmail || request.email;
            const phone = services.find((service) => service.serviceName === 'Phone')?.serviceId;

            if (!phone) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Phone service is required' });
            }

            await externalUserMethods.create({
                surname,
                firstName,
                middleName,
                email,
                phone,
                login: request.login,
                organizationUnitId: request.organizationUnitId,
            });
        }

        const newUser = prisma.user.create({
            data: {
                name: request.name,
                email: request.email,
                supervisor: { connect: { id: request.supervisorId || undefined } },
                login: request.login,
                title: request.title,
                memberships: request.groupId ? { create: { groupId: request.groupId } } : undefined,
                organizationUnit: { connect: { id: request.organizationUnitId } },
                services: { createMany: { data: services } },
                workStartDate: request.date,
                supplementalPositions: {
                    connect: request.supplementalPositions.map(({ id }) => ({
                        id,
                    })),
                },
            },
            include: { services: true },
        });
        return newUser;
    },
};
