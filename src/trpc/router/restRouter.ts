import { z } from 'zod';
import { VacancyStatus } from '@prisma/client';

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

import { tr } from './router.i18n';

const getUserByFieldFlatSchema = z.object({
    field: z.string(),
    value: z.string().optional(),
    serviceName: z.string().optional(),
    serviceId: z.string().optional(),
});

const userSchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
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
                description:
                    'https://github.com/taskany-inc/crew/blob/main/src/modules/userSchemas.ts#:~:text=getUserByFieldSchema',
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
        .input(createUserSchema)
        .output(userSchema)
        .mutation(({ input }) => {
            return userMethods.create(input);
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
        .mutation(async ({ input }) => {
            const { email, ...restInput } = input;
            const user = await userMethods.getUserByField({ field: 'email', value: email });
            return userMethods.edit({ id: user.id, ...restInput });
        }),

    editUserByField: restProcedure
        .meta({
            openapi: {
                method: 'PUT',
                path: '/users/edit-by-field',
                protect: true,
                summary: 'Update user by chosen field',
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

    editUserActiveState: restProcedure
        .meta({
            openapi: {
                method: 'PUT',
                path: '/users/edit-active',
                protect: true,
                summary: 'Activate/deactivate user by email',
            },
        })
        .input(
            z.object({
                email: z.string(),
                active: z.boolean(),
            }),
        )
        .output(userSchema)
        .mutation(async ({ input }) => {
            const user = await userMethods.getUserByField({ field: 'email', value: input.email });
            return userMethods.editActiveState({ id: user.id, active: input.active });
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
        .mutation(async ({ input }) => {
            const { actingUserEmail, targetUserEmail, ...restInput } = input;
            const targetUser = await userMethods.getUserByField({ field: 'email', value: targetUserEmail });
            const actingUser = await userMethods.getUserByField({ field: 'email', value: actingUserEmail });
            return bonusPointsMethods.change({ userId: targetUser.id, ...restInput }, actingUser);
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
        .query(({ input }) => vacancyMethods.edit(input)),

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
                name: z.string().nullable(),
                email: z.string(),
            }),
        )
        .query(async ({ input }) => {
            const { actingUserEmail, targetUserEmail, achievementId, amount } = input;

            const [targetUser, actingUser, achievement] = await Promise.all([
                userMethods.getUserByField({ field: 'email', value: targetUserEmail }),
                userMethods.getUserByField({ field: 'email', value: actingUserEmail }),
                achievementMethods.getById(achievementId),
            ]);

            return achievementMethods.give(
                { achievementId, amount, userId: targetUser.id, achievementTitle: achievement.title },
                actingUser.id,
            );
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
