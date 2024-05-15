import { z } from 'zod';
import { VacancyStatus } from '@prisma/client';
import { translit } from '@taskany/bricks';

import { prisma } from '../../utils/prisma';
import { restProcedure, router } from '../trpcBackend';
import { userMethods } from '../../modules/userMethods';
import { createUserSchema, getUserByFieldSchema } from '../../modules/userSchemas';
import { changeBonusPointsSchema } from '../../modules/bonusPointsSchemas';
import { bonusPointsMethods } from '../../modules/bonusPointsMethods';
import { groupMethods } from '../../modules/groupMethods';
import { vacancyMethods } from '../../modules/vacancyMethods';
import { getVacancyListSchema } from '../../modules/vacancySchemas';
import { getAchievementListSchema, giveAchievementSchema } from '../../modules/achievementSchemas';
import { achievementMethods } from '../../modules/achievementMethods';
import { getOrganizationUnitListSchema } from '../../modules/organizationUnitSchemas';
import { organizationUnitMethods } from '../../modules/organizationUnitMethods';
import { getServiceListSchema } from '../../modules/serviceSchemas';
import { serviceMethods } from '../../modules/serviceMethods';
import { historyEventMethods } from '../../modules/historyEventMethods';
import { dropUnchangedValuesFromEvent } from '../../utils/dropUnchangedValuesFromEvents';
import { config } from '../../config';
import { searchMethods } from '../../modules/searchMethods';

import { tr } from './router.i18n';

const getCorporateEmail = (login: string | null) => {
    const domain = config.corporateEmailDomain || '@taskany.org';
    return `${login}${domain}`;
};

const getUserByFieldFlatSchema = z.object({
    field: z.string(),
    value: z.string().optional(),
    serviceName: z.string().optional(),
    serviceId: z.string().optional(),
});

const userSchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    login: z.string().nullable(),
    email: z.string(),
    active: z.boolean(),
    supervisorId: z.string().nullable(),
    bonusPoints: z.number(),
});

export const restRouter = router({
    getUserByEmail: restProcedure
        .meta({
            openapi: {
                method: 'GET',
                path: '/users',
                protect: true,
                summary: 'Get user by email',
                deprecated: true,
            },
        })
        .input(
            z.object({
                email: z.string(),
            }),
        )
        .output(userSchema)
        .query(({ input }) => {
            return userMethods.getUserByField({ field: 'email', value: input.email });
        }),

    getUserByField: restProcedure
        .meta({
            openapi: {
                method: 'GET',
                path: '/users/get-by-field',
                protect: true,
                summary: 'Get user by chosen field',
                deprecated: true,
            },
        })
        .input(getUserByFieldFlatSchema)
        .output(
            userSchema.extend({
                organizationalGroupMembership: z
                    .object({
                        group: z.object({
                            id: z.string(),
                            name: z.string(),
                        }),
                        roles: z.array(
                            z.object({
                                name: z.string(),
                            }),
                        ),
                    })
                    .nullable(),
                achievements: z.array(
                    z.object({
                        count: z.number(),
                        achievement: z.object({
                            id: z.string(),
                            description: z.string(),
                            title: z.string(),
                            icon: z.string(),
                        }),
                    }),
                ),
            }),
        )
        .query(async ({ input }) => {
            const validatedInput = await getUserByFieldSchema.parseAsync(input);
            const user = await userMethods.getUserByField(validatedInput);
            const [achievements, organizationalGroupMembership] = await Promise.all([
                prisma.userAchievement.findMany({
                    where: { userId: user.id },
                    include: { achievement: true },
                }),
                prisma.membership.findFirst({
                    where: { userId: user.id, group: { organizational: true } },
                    select: { roles: true, group: true },
                }),
            ]);
            return { ...user, achievements, organizationalGroupMembership };
        }),

    createUser: restProcedure
        .meta({
            openapi: {
                method: 'POST',
                path: '/users/create',
                protect: true,
                summary: 'Create new user',
            },
        })
        .input(
            createUserSchema
                .omit({
                    firstName: true,
                    middleName: true,
                    surname: true,
                    supervisorId: true,
                })
                .extend({
                    name: z
                        .string()
                        .refine(
                            (s) => s.trim().split(' ').length > 1,
                            'Name should include surname and firstName, middleName is optional',
                        ),
                    serviceNumber: z.string(),
                    supervisorLogin: z.string(),
                }),
        )
        .output(
            z.object({
                id: z.string(),
                name: z.string().nullable(),
                login: z.string().nullable(),
                registrationEmail: z.string(),
                corporateEmail: z.string(),
                active: z.boolean(),
                supervisorLogin: z.string().nullish(),
            }),
        )
        .mutation(async ({ input, ctx }) => {
            const apiToken = await prisma.apiToken.findUnique({
                where: {
                    id: ctx.apiToken,
                },
                select: { organizationUnit: true },
            });
            const [surname, firstName, middleName = ''] = input.name.split(' ');

            const supervisor = await userMethods.getByLogin(input.supervisorLogin);

            const user = await userMethods.create({
                ...input,
                supervisorId: supervisor.id,
                surname,
                firstName,
                middleName,
            });

            if (apiToken?.organizationUnit) {
                const { organizationUnit } = apiToken;

                await prisma.userService.create({
                    data: {
                        userId: user.id,
                        serviceName: 'ServiceNumber',
                        serviceId: input.serviceNumber,
                        organizationUnitId: organizationUnit.id,
                    },
                });
            }

            await historyEventMethods.create({ token: ctx.apiToken }, 'createUser', {
                groupId: undefined,
                userId: user.id,
                before: undefined,
                after: {
                    name: user.name || undefined,
                    email: user.email,
                    phone: input.phone,
                    login: input.login,
                    organizationalUnitId: user.organizationUnitId || input.organizationUnitId,
                    accountingId: input.accountingId,
                    supervisorId: user.supervisorId || undefined,
                    createExternalAccount: input.createExternalAccount,
                },
            });

            return {
                ...user,
                registrationEmail: user.email,
                corporateEmail: getCorporateEmail(user.login),
                supervisorLogin: supervisor.login,
            };
        }),

    editUser: restProcedure
        .meta({
            openapi: {
                method: 'PUT',
                path: '/users/edit',
                protect: true,
                summary: 'Update user by email',
                deprecated: true,
            },
        })
        .input(
            z.object({
                email: z.string(),
                name: z.string().optional(),
                supervisorId: z.string().nullish(),
            }),
        )
        .output(userSchema)
        .mutation(async ({ input, ctx }) => {
            const { email, ...restInput } = input;
            const userBefore = await userMethods.getUserByField({ field: 'email', value: email });
            const result = await userMethods.edit({ id: userBefore.id, ...restInput });
            const { before, after } = dropUnchangedValuesFromEvent(
                { name: userBefore.name, supervisorId: userBefore.supervisorId },
                { name: result.name, supervisorId: result.supervisorId },
            );
            await historyEventMethods.create({ token: ctx.apiToken }, 'editUser', {
                groupId: undefined,
                userId: result.id,
                before,
                after,
            });
            return result;
        }),

    editUserByField: restProcedure
        .meta({
            openapi: {
                method: 'PUT',
                path: '/users/edit-by-field',
                protect: true,
                summary: 'Update user by chosen field',
                deprecated: true,
            },
        })
        .input(
            z.object({
                user: getUserByFieldFlatSchema,
                data: z.object({
                    name: z.string().optional(),
                    supervisorId: z.string().nullish(),
                }),
            }),
        )
        .output(userSchema)
        .query(async ({ input }) => {
            const validatedUserInput = await getUserByFieldSchema.parseAsync(input.user);
            const user = await userMethods.getUserByField(validatedUserInput);
            return userMethods.edit({ id: user.id, ...input.data });
        }),

    editUserByLogin: restProcedure
        .meta({
            openapi: {
                method: 'PUT',
                path: '/users/{login}',
                protect: true,
                summary: 'Update user by login',
            },
        })
        .input(
            z.object({
                login: z.string(),
                data: z.object({
                    name: z.string().optional(),
                    registrationEmail: z.string().optional(),
                    phone: z.string().optional(),
                    organizationUnitId: z.string().optional(),
                    supervisorLogin: z.string().optional(),
                }),
            }),
        )
        .output(
            z.object({
                id: z.string(),
                name: z.string().nullable(),
                login: z.string().nullable(),
                registrationEmail: z.string(),
                corporateEmail: z.string(),
                active: z.boolean(),
                supervisorLogin: z.string().nullish(),
            }),
        )
        .query(async ({ input, ctx }) => {
            const user = await userMethods.getByLogin(input.login);
            let newSupervisor: Awaited<ReturnType<typeof userMethods.getByLogin>> | null = null;

            if (input.data.supervisorLogin && user.supervisor?.login !== input.data.supervisorLogin) {
                newSupervisor = await userMethods.getByLogin(input.data.supervisorLogin);
            }

            const fieldsToUpdate: Record<string, string> = {};

            if (input.data.organizationUnitId && input.data.organizationUnitId !== user.organizationUnitId) {
                const newOrganization = await prisma.organizationUnit.findUnique({
                    where: {
                        id: input.data.organizationUnitId,
                    },
                });

                if (newOrganization) {
                    fieldsToUpdate.organizationUnitId = newOrganization.id;
                }
            }

            if (input.data.name && input.data.name !== user.name) {
                fieldsToUpdate.name = input.data.name;
            }
            if (newSupervisor?.id && newSupervisor?.id !== user.supervisorId) {
                fieldsToUpdate.supervisorId = newSupervisor.id;
            }
            if (input.data.registrationEmail && input.data.registrationEmail !== user.email) {
                fieldsToUpdate.email = input.data.registrationEmail;
            }

            const { supervisorId, email, ...rest } = await prisma.user.update({
                where: { id: user.id },
                data: fieldsToUpdate,
            });

            const phoneService = await prisma.userService.findFirst({
                where: {
                    userId: user.id,
                    serviceName: 'Phone',
                },
            });

            if (input.data.phone && phoneService?.serviceId !== input.data.phone) {
                if (phoneService) {
                    await prisma.userService.update({
                        where: {
                            serviceName_serviceId: {
                                serviceName: 'Phone',
                                serviceId: phoneService.serviceId,
                            },
                        },
                        data: {
                            serviceName: 'Phone',
                            serviceId: input.data.phone,
                        },
                    });
                } else {
                    await prisma.userService.create({
                        data: {
                            userId: user.id,
                            serviceName: 'Phone',
                            serviceId: input.data.phone,
                        },
                    });
                }
            }

            const { before, after } = dropUnchangedValuesFromEvent(
                {
                    name: user.name,
                    email: user.email,
                    phone: phoneService?.serviceId,
                    organizationalUnitId: user.organizationUnitId,
                    supervisorId: user.supervisorId,
                },
                {
                    name: input.data.name,
                    email: input.data.registrationEmail,
                    phone: input.data.phone,
                    organizationalUnitId: input.data.organizationUnitId,
                    supervisorId: newSupervisor?.id,
                },
            );
            await historyEventMethods.create({ token: ctx.apiToken }, 'editUser', {
                groupId: undefined,
                userId: user.id,
                before,
                after,
            });

            return {
                ...rest,
                registrationEmail: email,
                corporateEmail: getCorporateEmail(user.login),
                supervisorLogin: newSupervisor?.login,
            };
        }),

    getUserByLogin: restProcedure
        .meta({
            openapi: {
                method: 'GET',
                path: '/users/{login}',
                protect: true,
                summary: 'Get user by login',
            },
        })
        .input(z.object({ login: z.string() }))
        .output(
            z.object({
                id: z.string(),
                surname: z.string(),
                firstName: z.string(),
                middleName: z.string().optional(),
                registrationEmail: z.string().nullish(),
                corporateEmail: z.string(),
                phone: z.string().nullish(),
                login: z.string().nullable(),
                serviceNumber: z.string().nullish(),
                accountingId: z.string().nullish(),
                organizationUnitId: z.string().nullable(),
                groups: z
                    .object({
                        id: z.string(),
                        name: z.string(),
                        roles: z.string().array(),
                    })
                    .array(),
                supervisorLogin: z.string().nullish(),
                active: z.boolean(),
            }),
        )
        .query(async ({ input }) => {
            const user = await userMethods.getByLogin(input.login);
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
        }),

    editActiveByLogin: restProcedure
        .meta({
            openapi: {
                method: 'PUT',
                path: '/users/{login}/edit-active',
                protect: true,
                summary: 'Activate/deactivate user by login',
            },
        })
        .input(z.object({ login: z.string(), data: z.object({ active: z.boolean() }) }))
        .output(
            z.object({
                id: z.string(),
                name: z.string().nullable(),
                login: z.string().nullable(),
                registrationEmail: z.string(),
                corporateEmail: z.string(),
                active: z.boolean(),
                supervisorLogin: z.string().nullish(),
            }),
        )
        .query(async ({ input, ctx }) => {
            const user = await userMethods.getByLogin(input.login);

            let updatedUser: Awaited<ReturnType<typeof userMethods.editActiveState>> = user;
            if (user.active !== input.data.active) {
                updatedUser = await userMethods.editActiveState({ id: user.id, active: input.data.active });

                await historyEventMethods.create({ token: ctx.apiToken }, 'editUserActiveState', {
                    groupId: undefined,
                    userId: user.id,
                    before: user.active,
                    after: input.data.active,
                });
            }

            return {
                id: updatedUser.id,
                name: updatedUser.name,
                login: updatedUser.login,
                registrationEmail: updatedUser.email,
                corporateEmail: getCorporateEmail(updatedUser.login),
                active: updatedUser.active,
                supervisorLogin: user.supervisor?.login,
            };
        }),

    globalSearchUsers: restProcedure
        .meta({
            openapi: {
                method: 'GET',
                path: '/search/users',
                protect: true,
                summary: 'Global search users',
            },
        })
        .input(z.object({ query: z.string() }))
        .output(z.array(userSchema))
        .query(({ input }) => {
            const { query } = input;
            const translitInput = translit(query);
            return searchMethods.globalUsers(query, translitInput);
        }),

    editUserActiveState: restProcedure
        .meta({
            openapi: {
                method: 'PUT',
                path: '/users/edit-active',
                protect: true,
                summary: 'Activate/deactivate user by email',
                deprecated: true,
            },
        })
        .input(
            z.object({
                email: z.string(),
                active: z.boolean(),
            }),
        )
        .output(userSchema)
        .mutation(async ({ input, ctx }) => {
            const userBefore = await userMethods.getUserByField({ field: 'email', value: input.email });
            const result = await userMethods.editActiveState({ id: userBefore.id, active: input.active });
            if (userBefore.active !== result.active) {
                await historyEventMethods.create({ token: ctx.apiToken }, 'editUserActiveState', {
                    userId: result.id,
                    groupId: undefined,
                    before: userBefore.active,
                    after: result.active,
                });
            }
            return result;
        }),

    changeUserBonusPoints: restProcedure
        .meta({
            openapi: {
                method: 'PUT',
                path: '/users/bonus',
                protect: true,
                summary: 'Add/subtract bonus points from user',
            },
        })
        .input(
            changeBonusPointsSchema.omit({ userId: true }).extend({
                targetUserEmail: z.string(),
                actingUserEmail: z.string(),
            }),
        )
        .output(userSchema)
        .mutation(async ({ input, ctx }) => {
            const { actingUserEmail, targetUserEmail, ...restInput } = input;
            const targetUser = await userMethods.getUserByField({ field: 'email', value: targetUserEmail });
            const actingUser = await userMethods.getUserByField({ field: 'email', value: actingUserEmail });
            const result = await bonusPointsMethods.change({ userId: targetUser.id, ...restInput }, actingUser.id);
            await historyEventMethods.create({ token: ctx.apiToken }, 'editUserBonuses', {
                groupId: undefined,
                userId: result.id,
                before: { amount: targetUser.bonusPoints },
                after: { amount: result.bonusPoints, description: input.description },
            });
            return result;
        }),

    getGroupById: restProcedure
        .meta({
            openapi: {
                method: 'POST',
                path: '/groups/info',
                protect: true,
                summary: 'Get groups by ids',
            },
        })
        .input(
            z.object({
                ids: z.array(z.string()),
            }),
        )
        .output(
            z.array(
                z.object({
                    id: z.string(),
                    name: z.string(),
                    description: z.string().nullable(),
                    supervisor: z
                        .object({
                            id: z.string(),
                            name: z.string().nullable(),
                            email: z.string(),
                        })
                        .nullish(),
                    memberships: z.array(
                        z.object({
                            user: z.object({
                                id: z.string(),
                                name: z.string().nullable(),
                                email: z.string(),
                                image: z.string().nullable(),
                            }),
                            roles: z.array(
                                z.object({
                                    name: z.string(),
                                }),
                            ),
                            percentage: z.number().nullable(),
                        }),
                    ),
                }),
            ),
        )
        .mutation(async ({ input }) => {
            return groupMethods.getByIds(input.ids);
        }),

    getGroupList: restProcedure
        .meta({
            openapi: {
                method: 'POST',
                path: '/groups/list',
                protect: true,
                summary: 'Get list of groups with filtering',
            },
        })
        .input(
            z.object({
                search: z.string().optional(),
                hasVacancies: z.boolean().optional(),
                filter: z.array(z.string()).optional(),
                take: z
                    .number()
                    .max(100, { message: tr('Max {max} items in a single request', { max: 100 }) })
                    .optional(),
                skip: z.number().optional(),
            }),
        )
        .output(
            z.array(
                z.object({
                    id: z.string(),
                    name: z.string(),
                    description: z.string().nullable(),
                }),
            ),
        )
        .query(({ input }) => {
            return groupMethods.getList(input);
        }),

    getVacancyById: restProcedure
        .meta({
            openapi: {
                method: 'GET',
                path: '/vacancy/{id}',
                protect: true,
                summary: 'Get vacancy by id',
            },
        })
        .input(
            z.object({
                id: z.string(),
            }),
        )
        .output(
            z.object({
                id: z.string(),
                name: z.string(),
                hireStreamId: z.string(),
                archived: z.boolean(),
                group: z.object({ name: z.string(), id: z.string() }),
                hr: z.object({ name: z.string().nullable(), id: z.string(), email: z.string() }),
                hiringManager: z.object({ name: z.string().nullable(), id: z.string(), email: z.string() }),
                status: z.nativeEnum(VacancyStatus),
                unit: z.number().nullable(),
                grade: z.number().nullable(),
            }),
        )
        .query(({ input }) => vacancyMethods.getById(input.id)),

    getVacancyList: restProcedure
        .meta({
            openapi: {
                method: 'POST',
                path: '/vacancies/list',
                protect: true,
                summary: 'Get list of vacancies with filtering',
            },
        })
        .input(getVacancyListSchema)
        .output(
            z.object({
                vacancies: z.array(
                    z.object({
                        id: z.string(),
                        name: z.string(),
                        hireStreamId: z.string(),
                        archived: z.boolean(),
                        group: z.object({ name: z.string(), id: z.string() }),
                        hr: z.object({ name: z.string().nullable(), id: z.string(), email: z.string() }),
                        hiringManager: z.object({ name: z.string().nullable(), id: z.string(), email: z.string() }),
                        status: z.nativeEnum(VacancyStatus),
                        unit: z.number().nullable(),
                        grade: z.number().nullable(),
                        activeSince: z.date().nullable(),
                        closedAt: z.date().nullable(),
                        timeAtWork: z.number(),
                    }),
                ),
                count: z.number(),
                total: z.number(),
            }),
        )
        .query(({ input }) => vacancyMethods.getList(input)),

    updateVacancy: restProcedure
        .meta({
            openapi: {
                method: 'POST',
                path: '/vacancy',
                protect: true,
                summary: 'Update vacancy by id',
            },
        })
        .input(
            z.object({
                id: z.string(),
                unit: z.number().optional(),
                status: z.nativeEnum(VacancyStatus).optional(),
            }),
        )
        .output(
            z.object({
                id: z.string(),
                name: z.string(),
                hireStreamId: z.string(),
                archived: z.boolean(),
                group: z.object({ name: z.string(), id: z.string() }),
                hr: z.object({ name: z.string().nullable(), id: z.string(), email: z.string() }),
                hiringManager: z.object({ name: z.string().nullable(), id: z.string(), email: z.string() }),
                status: z.nativeEnum(VacancyStatus),
                unit: z.number().nullable(),
                grade: z.number().nullable(),
            }),
        )
        .query(async ({ input, ctx }) => {
            const vacancyBefore = await vacancyMethods.getByIdOrThrow(input.id);
            const result = await vacancyMethods.edit(input);
            const { before, after } = dropUnchangedValuesFromEvent(
                {
                    status: vacancyBefore.status,
                    hiringManagerId: vacancyBefore.hiringManagerId,
                    hrId: vacancyBefore.hrId,
                    grade: vacancyBefore.grade,
                    unit: vacancyBefore.unit,
                },
                {
                    status: result.status,
                    hiringManagerId: result.hiringManagerId,
                    hrId: result.hrId,
                    grade: result.grade,
                    unit: result.unit,
                },
            );
            await historyEventMethods.create({ token: ctx.apiToken }, 'editVacancy', {
                groupId: result.groupId,
                userId: undefined,
                before: { id: result.id, name: vacancyBefore.name, ...before },
                after: { id: result.id, name: result.name, ...after },
            });
            return result;
        }),

    getAchievementList: restProcedure
        .meta({
            openapi: {
                method: 'GET',
                path: '/achievements/list',
                protect: true,
                summary: 'Get list of achievements with filtering',
            },
        })
        .input(getAchievementListSchema)
        .output(
            z.array(
                z.object({
                    id: z.string(),
                    title: z.string(),
                    icon: z.string(),
                    description: z.string(),
                }),
            ),
        )
        .query(({ input }) => achievementMethods.getList(input)),

    giveCrewAchievement: restProcedure
        .meta({
            openapi: {
                method: 'POST',
                path: '/achievements/give',
                protect: true,
                summary: 'Give user crew achievement',
            },
        })
        .input(
            giveAchievementSchema.omit({ userId: true, achievementTitle: true }).extend({
                targetUserEmail: z.string(),
                actingUserEmail: z.string(),
            }),
        )
        .output(
            z.object({
                id: z.string(),
                title: z.string(),
                description: z.string(),
            }),
        )
        .query(async ({ input, ctx }) => {
            const { actingUserEmail, targetUserEmail, achievementId, amount } = input;
            const [targetUser, actingUser, achievement] = await Promise.all([
                userMethods.getUserByField({ field: 'email', value: targetUserEmail }),
                userMethods.getUserByField({ field: 'email', value: actingUserEmail }),
                achievementMethods.getById(achievementId),
            ]);
            const result = await achievementMethods.give(
                { achievementId, amount, userId: targetUser.id },
                actingUser.id,
            );
            await historyEventMethods.create({ token: ctx.apiToken }, 'giveAchievementToUser', {
                groupId: undefined,
                userId: targetUser.id,
                before: undefined,
                after: { id: achievement.id, title: achievement.title, amount: input.amount },
            });
            return result;
        }),

    getServiceList: restProcedure
        .meta({
            openapi: {
                method: 'GET',
                path: '/service/list',
                protect: true,
                summary: 'Get list of services with filtering',
            },
        })
        .input(getServiceListSchema)
        .output(
            z.array(
                z.object({
                    name: z.string(),
                    displayName: z.string().nullable(),
                    linkPrefix: z.string().nullable(),
                }),
            ),
        )
        .query(({ input }) => {
            return serviceMethods.getList(input);
        }),

    getOrganizationUnitList: restProcedure
        .meta({
            openapi: {
                method: 'GET',
                path: '/org-unit/list',
                protect: true,
                summary: 'Get list of organizational units with filtering',
            },
        })
        .input(getOrganizationUnitListSchema)
        .output(
            z.array(
                z.object({
                    id: z.string(),
                    name: z.string(),
                    country: z.string(),
                    description: z.string().nullable(),
                }),
            ),
        )
        .query(({ input }) => {
            return organizationUnitMethods.getList(input);
        }),
});
