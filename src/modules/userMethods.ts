import { Prisma, SupplementalPosition, User, PositionStatus, UserCreationRequestStatus } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { sql } from 'kysely';

import { prisma } from '../utils/prisma';
import { SessionUser } from '../utils/auth';
import { suggestionsTake } from '../utils/suggestions';
import { defaultTake } from '../utils';
import { getCorporateEmail } from '../utils/getCorporateEmail';
import { calculateDiffBetweenArrays } from '../utils/calculateDiffBetweenArrays';
import { ExternalServiceName, findService } from '../utils/externalServices';
import { getLastSupplementalPositions } from '../utils/supplementalPositions';
import { db } from '../utils/db';
import { getSearchRegex, regexEscape, regexReplaceYo } from '../utils/regex';
import { getUnitGroup } from '../utils/getUnitGroup';
import { trimAndJoin } from '../utils/trimAndJoin';

import {
    MembershipInfo,
    UserAchievements,
    UserMemberships,
    UserSettings,
    UserSupervisorOf,
    UserSupervisorIn,
    UserMeta,
    UserRoleData,
    MailingSettingType,
    UserScheduledDeactivations,
    UserSupplementalPositions,
    UserNames,
    UserServices,
    UserCurators,
    UserCuratorOf,
    UserLocation,
    UserSupervisorWithSupplementalPositions,
    UserUserCreationRequestsTarget,
} from './userTypes';
import {
    AddUserToGroup,
    EditUserSettings,
    GetUserList,
    RemoveUserFromGroup,
    GetUserSuggestions,
    EditUserActiveState,
    GetUserByField,
    EditUser,
    UserRestApiData,
    EditUserRoleData,
    EditUserMailingSettings,
    UpdateMembershipPercentage,
    SameNameCheck,
} from './userSchemas';
import { Location } from './locationTypes';
import { tr } from './modules.i18n';
import { addCalculatedGroupFields, groupMethods } from './groupMethods';
import { userAccess } from './userAccess';
import { externalUserMethods } from './externalUserMethods';
import { mailSettingsMethods } from './mailSettingsMethods';
import { locationMethods } from './locationMethods';
import { serviceMethods } from './serviceMethods';
import { UserCreationRequestType } from './userCreationRequestTypes';

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

export const getUserListQuery = async (data: GetUserList) => {
    let query = db
        .selectFrom('User')
        .leftJoin('UserServices as us', 'User.id', 'us.userId')
        .leftJoin('Membership as m', 'User.id', 'm.userId')
        .leftJoin('_MembershipToRole as mtr', 'm.id', 'mtr.A')
        .leftJoin('Role as r', 'r.id', 'mtr.B')
        .leftJoin('MailingSettings as ms', 'User.id', 'ms.userId');
    if (data.search) {
        const regex = getSearchRegex(data.search);
        query = query.where((eb) =>
            eb.or([
                eb('User.name', '~*', regex),
                eb('User.email', '~*', regex),
                eb('User.login', '~*', regex),
                eb('us.serviceId', '~*', regex),
            ]),
        );
    }
    if (data.supervisors) {
        query = query.where('User.supervisorId', 'in', data.supervisors);
    }
    if (data.groups) {
        let groupIds = [...data.groups];
        if (data.includeChildrenGroups) {
            groupIds = await groupMethods.getDeepChildrenIds(groupIds);
        }
        query = query.where('m.groupId', 'in', groupIds);
    }
    if (data.roles) {
        query = query.where('r.id', 'in', data.roles);
    }
    if (data.active !== undefined) {
        query = query.where('User.active', 'is', data.active);
    }
    if (data.mailingSettings) {
        query = query
            .where(`ms.${data.mailingSettings.type}`, 'is', true)
            .where('ms.organizationUnitId', '=', data.mailingSettings.organizationUnitId);
    }
    return {
        query: query
            // TODO: delete after removing roleDeprecated from db
            .select(sql<'USER'>`'USER'`.as('roleDeprecated'))
            .groupBy('User.id'),
    };
};

export const userMethods = {
    getByIdOrThrow: async (id: string): Promise<User> => {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: `No user with id ${id}` });
        return user;
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

        return prisma.membership.create({
            data: {
                groupId: data.groupId,
                userId: data.userId,
                percentage: data.percentage,
                roles: { connect: data.roles ? data.roles.map(({ id }) => ({ id })) : [] },
            },
        });
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
            UserSupervisorWithSupplementalPositions &
            UserAchievements &
            UserSupervisorOf &
            UserSupervisorIn &
            UserRoleData &
            UserScheduledDeactivations &
            UserUserCreationRequestsTarget &
            UserSupplementalPositions &
            UserServices &
            UserCurators &
            UserCuratorOf &
            UserLocation
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
                                supplementalPositions: {
                                    include: {
                                        organizationUnit: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { group: { name: 'asc' } },
                },
                services: true,
                supervisor: {
                    include: {
                        supplementalPositions: {
                            include: {
                                organizationUnit: true,
                            },
                        },
                    },
                },
                achievements: { include: { achievement: true }, where: { achievement: { hidden: false } } },
                settings: true,
                supervisorOf: { where: { active: true } },
                supervisorIn: { where: { archived: false } },
                groupAdmins: true,
                role: true,
                scheduledDeactivations: {
                    orderBy: { createdAt: 'desc' },
                    include: { organizationUnit: true, newOrganizationUnit: true, attaches: true },
                },
                userCreationRequestTarget: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        supplementalPositions: {
                            include: {
                                organizationUnit: true,
                            },
                        },
                    },
                },
                curators: true,
                curatorOf: { where: { active: true } },
                location: true,
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
        if (Object.keys(data).length === 0) {
            throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'No search data is provided' });
        }
        let query = db.selectFrom('User').leftJoin('UserServices as us', 'User.id', 'us.userId').selectAll('User');
        if (data.id) {
            query = query.where('User.id', '=', data.id);
        }
        if (data.email) {
            query = query.where((eb) =>
                eb.or([
                    eb('User.email', '=', data.email!),
                    eb.and([eb('us.serviceName', 'ilike', '%mail%'), eb('us.serviceId', '=', data.email!)]),
                ]),
            );
        }
        if (data.login) {
            query = query.where('User.login', '=', data.login);
        }
        if (data.serviceName && data.serviceId) {
            query = query.where((eb) =>
                eb.and([eb('us.serviceName', '=', data.serviceName!), eb('us.serviceId', '=', data.serviceId!)]),
            );
        }
        const user = await query.executeTakeFirst();
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

        const { query } = await getUserListQuery(restData);

        const { counter } = await query
            .clearSelect()
            .clearGroupBy()
            .select((eb) => [eb.fn.count<number>('User.id').distinct().as('counter')])
            .executeTakeFirstOrThrow();

        const { total } = await db
            .selectFrom('User')
            .select((eb) => [eb.fn.countAll<number>().as('total')])
            .executeTakeFirstOrThrow();

        if (!counter) {
            return {
                items: [],
                counter,
                total,
            };
        }

        const users = await query
            .limit(take || defaultTake)
            .offset(cursor || 0)
            .orderBy('User.active', 'desc')
            .selectAll('User')
            .execute();

        let nextCursor: number | undefined = (cursor || 0) + (take || defaultTake);
        if (nextCursor > counter) nextCursor = undefined;

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
                        supplementalPositions: {
                            include: {
                                organizationUnit: true,
                            },
                        },
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

    edit: async ({ id, savePreviousName, curatorIds, supervisorId, login, name, email, location }: EditUser) => {
        const updateUser: Prisma.UserUpdateInput = {
            login,
            name,
            email,
        };
        const userBeforeUpdate = await userMethods.getById(id);

        if (curatorIds) {
            const ids = curatorIds.map((id) => ({ id }));
            const oldIds = userBeforeUpdate.curators?.map(({ id }) => ({ id }));

            const curatorIdsToConnect = calculateDiffBetweenArrays(ids, oldIds);
            const curatorIdsToDisconnect = calculateDiffBetweenArrays(oldIds, ids);

            updateUser.curators = {
                connect: curatorIdsToConnect,
                disconnect: curatorIdsToDisconnect,
            };

            if (curatorIds.includes(userBeforeUpdate.id)) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'You can`t add the current user to the curators' });
            }
        }

        if (supervisorId && supervisorId !== userBeforeUpdate.supervisorId) {
            updateUser.supervisor = {
                connect: { id: supervisorId },
            };
        }

        if (location && location !== userBeforeUpdate.location?.name) {
            const newLocation = await locationMethods.findOrCreate(location);

            updateUser.location = {
                connect: { id: newLocation.id },
            };
        }

        if (userBeforeUpdate.name !== name || userBeforeUpdate.supervisorId !== supervisorId) {
            await externalUserMethods.update(id, {
                name,
                supervisorId,
            });
        }

        if (savePreviousName && userBeforeUpdate.name) {
            await prisma.userNames.create({ data: { userId: id, name: userBeforeUpdate.name } });
        }

        return prisma.user.update({
            where: { id },
            data: updateUser,
            include: {
                curators: true,
                location: true,
                supervisor: true,
                supplementalPositions: { include: { organizationUnit: true } },
            },
        });
    },

    editActiveState: async (data: EditUserActiveState): Promise<User> => {
        await externalUserMethods.update(data.id, { active: data.active, method: data.method });
        const currentUser = await userMethods.getById(data.id);

        if (!currentUser) {
            throw new TRPCError({ code: 'NOT_FOUND', message: `User with id ${data.id} not found` });
        }

        const workEndDate = new Date();

        if (data.active) {
            const currentDate = new Date();

            const { positions: lastFiredPositions, endDate: lastPositionEndDate } = getLastSupplementalPositions(
                currentUser.supplementalPositions,
            );

            if (lastFiredPositions.length > 0 && lastPositionEndDate) {
                const hoursDifference =
                    Math.abs(currentDate.getTime() - lastPositionEndDate.getTime()) / (1000 * 60 * 60);

                if (hoursDifference > 24) {
                    // If more than 24 hours have passed, create new positions
                    const newPositionsData = lastFiredPositions.map((p) => ({
                        userId: data.id,
                        organizationUnitId: p.organizationUnitId,
                        status: PositionStatus.ACTIVE,
                        percentage: p.percentage,
                        unitId: p.unitId,
                        main: p.main,
                        workStartDate: currentDate,
                        workEndDate: null,
                    }));

                    await prisma.supplementalPosition.createMany({
                        data: newPositionsData,
                    });
                } else {
                    // If less than 24 hours have passed, restore old positions
                    const positionIds = lastFiredPositions.map((p) => p.id);

                    await prisma.supplementalPosition.updateMany({
                        where: { id: { in: positionIds } },
                        data: { status: PositionStatus.ACTIVE, workEndDate: null },
                    });
                }
            }

            if (currentUser.deactivatedAt) {
                const deactivationDate = new Date(currentUser.deactivatedAt);
                const dayStart = new Date(deactivationDate);
                const dayEnd = new Date(deactivationDate);
                dayStart.setHours(0, 0, 0, 0);
                dayEnd.setHours(23, 59, 59, 999);

                // Find archived in deactivation day memberships
                const archivedMemberships = await prisma.membership.findMany({
                    where: {
                        userId: data.id,
                        archived: true,
                        updatedAt: {
                            gte: dayStart,
                            lte: dayEnd,
                        },
                    },
                });

                if (archivedMemberships.length > 0) {
                    // Restore archived memberships
                    await prisma.membership.updateMany({
                        where: { id: { in: archivedMemberships.map((m) => m.id) } },
                        data: { archived: false },
                    });
                }
            }
        } else {
            // If user is deactivated
            const activePositionIds = currentUser.supplementalPositions
                .filter((p) => p.status === PositionStatus.ACTIVE)
                .map((p) => p.id);

            // deactivate active positions
            if (activePositionIds.length > 0) {
                await prisma.supplementalPosition.updateMany({
                    where: { id: { in: activePositionIds } },
                    data: { status: PositionStatus.FIRED, workEndDate },
                });
            }

            // deactivate active memberships
            await prisma.membership.updateMany({
                where: { userId: data.id, archived: false },
                data: { archived: true },
            });

            await prisma.userDevice.updateMany({
                where: { userId: data.id, archived: false },
                data: { archived: true, archivedAt: workEndDate },
            });
        }

        return prisma.user.update({
            where: { id: data.id },
            data: {
                active: data.active,
                deactivatedAt: data.active ? null : workEndDate,
            },
        });
    },

    getAvailableMembershipPercentage: async (userId: string): Promise<number> => {
        const memberships = await prisma.membership.findMany({ where: { userId, percentage: { not: null } } });
        const total = memberships.reduce((prev, curr) => prev + (curr.percentage ?? 0), 0);
        return 100 - Math.min(Math.max(total, 0), 100);
    },

    suggestions: async ({ query, include, exclude, take = suggestionsTake }: GetUserSuggestions) => {
        const where: Prisma.UserWhereInput = {
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { otherNames: { some: { name: { contains: query, mode: 'insensitive' } } } },
                { email: { contains: query, mode: 'insensitive' } },
            ],
            AND: [{ active: true }],
        };

        const notIn = [];

        if (exclude) {
            notIn.push(...exclude);
        }
        if (include) {
            notIn.push(...include);
        }

        if (notIn.length) {
            where.id = { notIn };
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
                serviceName: ExternalServiceName.ServiceNumber,
            },
        });

        const userServices = await serviceMethods.getUserServices(user.id);

        const phoneService = userServices.find((s) => s.serviceName === ExternalServiceName.Phone);
        const accountingService = userServices.find((s) => s.serviceName === ExternalServiceName.AccountingSystem);
        const workEmailService = userServices.find((s) => s.serviceName === ExternalServiceName.WorkEmail);
        const personalEmailService = userServices.find((s) => s.serviceName === ExternalServiceName.PersonalEmail);

        const { positions } = getLastSupplementalPositions(user.supplementalPositions);

        return {
            ...user,
            id: user.id,
            surname,
            firstName,
            middleName,
            registrationEmail: personalEmailService?.serviceId,
            workEmail: workEmailService?.serviceId,
            corporateEmail: getCorporateEmail(user.login),
            phone: phoneService?.serviceId,
            login: user.login,
            serviceNumber: serviceNumberService?.serviceId,
            accountingId: accountingService?.serviceId,
            groups: user.memberships.map((m) => ({
                id: m.groupId,
                name: m.group.name,
                roles: m.roles.map((r) => r.name),
            })),
            positions: positions.map((p) => ({
                organizationUnitId: p.organizationUnitId,
                percentage: p.percentage,
                unitId: p.unitId || '',
                workStartDate: p.workStartDate,
                status: p.status,
                main: p.main,
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
        organizationUnitIds: string[],
        additionUsersIds?: string[],
        workSpaceNotify?: boolean,
    ) => {
        const mailingList = await prisma.user.findMany({
            where: {
                OR: [
                    {
                        mailingSettings: {
                            some: { [mailingType]: true, organizationUnitId: { in: organizationUnitIds } },
                        },
                        active: true,
                    },
                    { id: { in: additionUsersIds } },
                ],
            },
            select: { email: true, name: true },
        });

        const additionalEmails = await mailSettingsMethods.getEmails({
            mailingType,
            organizationUnitIds,
        });

        if (workSpaceNotify) {
            const workSpaceNotifyEmails = await mailSettingsMethods.getEmails({
                mailingType,
                organizationUnitIds,
                workSpaceNotify,
            });
            additionalEmails.push(...workSpaceNotifyEmails);
        }

        const users = [
            ...mailingList.map(({ email, name }) => ({ email, name: name || undefined })),
            ...additionalEmails.map((email) => ({ email })),
        ];

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

    sameNameCheck: async ({ surname, firstName, middleName }: SameNameCheck) => {
        const fullName = trimAndJoin([surname, firstName, middleName]);
        if (!surname || !firstName || fullName.length < 6) return { users: [], requests: [] };
        const search = regexReplaceYo(regexEscape(fullName));
        const [users, requests] = await Promise.all([
            // false positive in eslint rule
            // eslint-disable-next-line newline-per-chained-call
            db.selectFrom('User').where('name', '~*', search).select(['id', 'name']).limit(5).execute(),
            db
                .selectFrom('UserCreationRequest')
                .where('name', '~*', search)
                .where('type', 'in', [
                    UserCreationRequestType.internalEmployee,
                    UserCreationRequestType.transferInternToStaff,
                    UserCreationRequestType.transferInside,
                    UserCreationRequestType.createSuppementalPosition,
                ])
                .select(['id', 'name', 'type'])
                .limit(5)
                .execute(),
        ]);
        return { users, requests };
    },

    createUserFromRequest: async (userCreationRequestId: string) => {
        const request = await prisma.userCreationRequest.findUnique({
            where: { id: userCreationRequestId },
            include: { supplementalPositions: true, curators: true },
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
            const emailService = await prisma.externalService.findUnique({
                where: { name: ExternalServiceName.Email },
            });
            if (!emailService) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Email service not found' });
            services.push({ serviceName: emailService.name, serviceId: request.email });
        }

        if (request.personalEmail) {
            const emailService = await prisma.externalService.findUnique({
                where: { name: ExternalServiceName.PersonalEmail },
            });
            if (!emailService) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Personal email service not found' });
            }

            services.push({ serviceName: emailService.name, serviceId: request.personalEmail });
        }

        if (request.workEmail) {
            const emailService = await prisma.externalService.findUnique({
                where: { name: ExternalServiceName.WorkEmail },
            });

            if (!emailService) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Work email service not found' });
            services.push({ serviceName: emailService.name, serviceId: request.workEmail });
        }

        let location: Location | undefined;
        if (request.location) {
            location = await locationMethods.findOrCreate(request.location);
        }

        if (request.createExternalAccount) {
            const [surname, firstName, middleName] = request.name.split(' ');

            if (!request.workEmail && !request.personalEmail) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'No email(workEmail or personalEmail) for external service specified',
                });
            }

            const phone = findService(ExternalServiceName.Phone, services);

            if (!phone) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Phone service is required' });
            }

            const isExternal = request.type === 'externalFromMainOrgEmployee' || request.type === 'externalEmployee';

            let unit: string | undefined;
            if (request.groupId) {
                unit = await getUnitGroup(request.groupId);
            } else if (request.supervisorId) {
                const supervisorOrgGroup = await db
                    .selectFrom('Group')
                    .leftJoin('Membership as m', 'Group.id', 'm.groupId')
                    .where((eb) =>
                        eb.and([eb('Group.organizational', '=', true), eb('m.userId', '=', request.supervisorId)]),
                    )
                    .select('Group.id')
                    .executeTakeFirst();
                if (supervisorOrgGroup) {
                    unit = await getUnitGroup(supervisorOrgGroup.id);
                }
            }

            await externalUserMethods.create({
                surname,
                firstName,
                middleName,
                workMail: request.workEmail || undefined,
                personalMail: request.personalEmail || undefined,
                phone,
                login: request.login,
                organizationUnitId: request.organizationUnitId,
                isExternal,
                unit,
            });
        }

        const newUser = prisma.user.create({
            data: {
                name: request.name,
                email: request.email,
                supervisor: request.supervisorId ? { connect: { id: request.supervisorId } } : undefined,
                login: request.login,
                title: request.title,
                memberships: request.groupId ? { create: { groupId: request.groupId } } : undefined,
                services: { createMany: { data: services } },
                supplementalPositions: {
                    connect: request.supplementalPositions.map(({ id }) => ({
                        id,
                    })),
                },
                location: location ? { connect: { id: location.id } } : undefined,
                curators: {
                    connect: request.curators.map(({ id }) => ({
                        id,
                    })),
                },
            },
            include: { services: true },
        });

        return newUser;
    },

    resolveDecreeRequest: async (userCreationRequestId: string) => {
        const request = await prisma.userCreationRequest.findUnique({
            where: { id: userCreationRequestId },
            include: { supplementalPositions: true },
        });

        if (!request) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: `No user decree request by id ${userCreationRequestId}`,
            });
        }

        if (!request.userTargetId) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'No related User id provided',
            });
        }

        const currentUser = await userMethods.getById(request.userTargetId);

        if (!currentUser) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: `No User with id ${request.userTargetId}`,
            });
        }

        if (request.type === 'toDecree') {
            const updatedPositions = currentUser.supplementalPositions.reduce<SupplementalPosition[]>((acum, p) => {
                if (p.status !== 'ACTIVE') {
                    return acum;
                }
                const updatedPositions = request.supplementalPositions.find(
                    (item) => item.organizationUnitId === p.organizationUnitId,
                );

                if (updatedPositions) {
                    acum.push({
                        ...updatedPositions,
                        id: p.id,
                        userId: currentUser.id,
                    });
                }
                return acum;
            }, []);

            await prisma.$transaction(
                updatedPositions.map(({ id, ...data }) =>
                    prisma.supplementalPosition.update({
                        where: {
                            id,
                        },
                        data,
                    }),
                ),
            );
        }

        const userData: Prisma.UserUpdateInput = {
            active: request.disableAccount ? false : currentUser.active,
        };

        if (request.type === 'fromDecree') {
            userData.supplementalPositions = {
                connect: request.supplementalPositions.map(({ id }) => ({
                    id,
                })),
            };
        }

        if (currentUser.supervisorId !== request.supervisorId) {
            userData.supervisor = {};

            if (request.supervisorId) {
                userData.supervisor.connect = { id: request.supervisorId };
            }
            if (currentUser.supervisorId) {
                userData.supervisor.disconnect = { id: currentUser.supervisorId };
            }
        }

        const currentOrgGroup = currentUser.memberships.find((m) => m.group.organizational);

        if (currentOrgGroup?.group.id !== request.groupId) {
            userData.memberships = {};

            if (currentOrgGroup?.id) {
                await prisma.membership.update({
                    where: {
                        id: currentOrgGroup.id,
                    },
                    data: {
                        archived: true,
                    },
                });
            }

            if (request.groupId) {
                userData.memberships.create = {
                    groupId: request.groupId,
                    roles: request.title ? { connect: { name: request.title } } : undefined,
                };
            }
        }

        if (Object.keys(userData)) {
            await prisma.user.update({
                where: {
                    id: currentUser.id,
                },
                data: userData,
            });
        }

        await prisma.userCreationRequest.update({
            where: { id: userCreationRequestId },
            data: { status: UserCreationRequestStatus.Completed },
        });

        return userMethods.getById(request.userTargetId);
    },
};
