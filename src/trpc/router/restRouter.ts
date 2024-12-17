import { z } from 'zod';
import { VacancyStatus } from '@prisma/client';
import { TRPCError } from '@trpc/server';

import { prisma } from '../../utils/prisma';
import { restProcedure, router } from '../trpcBackend';
import { userMethods } from '../../modules/userMethods';
import { getUserByFieldSchema, userRestApiDataSchema } from '../../modules/userSchemas';
import { changeBonusPointsSchema } from '../../modules/bonusPointsSchemas';
import { bonusPointsMethods } from '../../modules/bonusPointsMethods';
import { groupMethods } from '../../modules/groupMethods';
import { vacancyMethods } from '../../modules/vacancyMethods';
import { getVacancyListSchema } from '../../modules/vacancySchemas';
import { getAchievementListSchema, giveAchievementSchema } from '../../modules/achievementSchemas';
import { achievementMethods } from '../../modules/achievementMethods';
import { organizationUnitSearchTypes } from '../../modules/organizationUnitSchemas';
import { organizationUnitMethods } from '../../modules/organizationUnitMethods';
import { getServiceListSchema } from '../../modules/serviceSchemas';
import { serviceMethods } from '../../modules/serviceMethods';
import { historyEventMethods } from '../../modules/historyEventMethods';
import { dropUnchangedValuesFromEvent } from '../../utils/dropUnchangedValuesFromEvents';
import { searchMethods } from '../../modules/searchMethods';
import { getCorporateEmail } from '../../utils/getCorporateEmail';
import { config } from '../../config';

import { tr } from './router.i18n';

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
    getUserByField: restProcedure
        .meta({
            openapi: {
                method: 'GET',
                path: '/users/get-by-field',
                protect: true,
                summary: 'Get user by chosen field',
            },
        })
        .input(getUserByFieldSchema)
        .output(userRestApiDataSchema)
        .query(({ input }) => {
            return userMethods.getUserDataForRestApi(input);
        }),

    editUserByLogin: restProcedure
        .meta({
            openapi: {
                method: 'PUT',
                path: '/user/{login}',
                protect: true,
                summary: 'Update user by login',
            },
        })
        .input(
            z.object({
                login: z.string(),
                data: z.object({
                    name: z.string().optional(),
                    savePreviousName: z.boolean().optional(),
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
            let newSupervisor: Awaited<ReturnType<typeof userMethods.getUserByField>> | null = null;

            if (input.data.supervisorLogin && user.supervisor?.login !== input.data.supervisorLogin) {
                newSupervisor = await userMethods.getUserByField({ login: input.data.supervisorLogin });
            }

            const { supervisorId, email, ...rest } = await userMethods.edit({
                id: user.id,
                email: input.data.registrationEmail,
                name: input.data.name,
                supervisorId: newSupervisor?.id,
                organizationUnitId: input.data.organizationUnitId,
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
                    savePreviousName: input.data.savePreviousName,
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
                path: '/user/{login}',
                protect: true,
                summary: 'Get user by login',
            },
        })
        .input(z.object({ login: z.string() }))
        .output(userRestApiDataSchema)
        .query(async ({ input }) => {
            return userMethods.getUserDataForRestApi(input);
        }),

    editActiveByLogin: restProcedure
        .meta({
            openapi: {
                method: 'PUT',
                path: '/user/{login}/edit-active',
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
            return searchMethods.globalUsers(query);
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
            const userBefore = await userMethods.getUserByField({ email: input.email });
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
            const targetUser = await userMethods.getUserByField({ email: targetUserEmail });
            const actingUser = await userMethods.getUserByField({ email: actingUserEmail });
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

    giveAchievementForHireSections: restProcedure
        .meta({
            openapi: {
                method: 'POST',
                path: '/achievements/sections',
                protect: true,
                summary: 'Give user crew achievement for hire sections',
            },
        })
        .input(
            giveAchievementSchema
                .omit({ userId: true, achievementTitle: true, achievementId: true, amount: true })
                .extend({
                    targetUserEmail: z.string(),
                    actingUserEmail: z.string(),
                    sectionsNumber: z.number(),
                }),
        )
        .output(z.string())
        .query(async ({ input, ctx }) => {
            const { actingUserEmail, targetUserEmail, sectionsNumber } = input;

            if (!config.sectionAchiementId || !config.sectionAmountForAchievement) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'No sectionAchiementId or sectionAmountForAchievement in crew config',
                });
            }

            const [targetUser, actingUser, achievement] = await Promise.all([
                userMethods.getUserByField({ email: targetUserEmail }),
                userMethods.getUserByField({ email: actingUserEmail }),
                achievementMethods.getById(config.sectionAchiementId),
            ]);

            if (sectionsNumber % Number(config.sectionAmountForAchievement) !== 0) {
                return 'Amount of completed sections is not evenly divisible by sectionAmountForAchievement';
            }

            const userAchievement = await prisma.userAchievement.findFirst({
                where: { userId: targetUser.id, achievementId: achievement.id },
            });

            const achievementCount = userAchievement ? userAchievement.count : 0;

            const amount = sectionsNumber / Number(config.sectionAmountForAchievement) - achievementCount;

            if (amount <= 0) return 'Not enough sections for achievement';

            await achievementMethods.give(
                {
                    achievementId: config.sectionAchiementId,
                    amount,
                    userId: targetUser.id,
                },
                actingUser.id,
            );
            await historyEventMethods.create({ token: ctx.apiToken }, 'giveAchievementToUser', {
                groupId: undefined,
                userId: targetUser.id,
                before: undefined,
                after: { id: achievement.id, title: achievement.title, amount },
            });
            return 'Achievement successfully given';
        }),

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
                userMethods.getUserByField({ email: targetUserEmail }),
                userMethods.getUserByField({ email: actingUserEmail }),
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
        .input(
            z.object({
                search: z.string().optional(),
                searchType: z.enum(organizationUnitSearchTypes).optional(),
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
                    country: z.string(),
                    description: z.string().nullable(),
                }),
            ),
        )
        .query(({ input }) => {
            return organizationUnitMethods.getList(input);
        }),
});
