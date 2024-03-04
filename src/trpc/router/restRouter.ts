import { z } from 'zod';
import { VacancyStatus } from 'prisma/prisma-client';

import { restProcedure, router } from '../trpcBackend';
import { userMethods } from '../../modules/userMethods';
import { changeBonusPointsSchema } from '../../modules/bonusPointsSchemas';
import { bonusPointsMethods } from '../../modules/bonusPointsMethods';
import { groupMethods } from '../../modules/groupMethods';
import { vacancyMethods } from '../../modules/vacancyMethods';
import { getVacancyListSchema } from '../../modules/vacancySchemas';

import { tr } from './router.i18n';

export const restRouter = router({
    getUserByEmail: restProcedure
        .meta({
            openapi: {
                method: 'GET',
                path: '/users',
            },
        })
        .input(
            z.object({
                email: z.string(),
            }),
        )
        .output(
            z.object({
                id: z.string(),
                name: z.string().nullable(),
                email: z.string(),
                bonusPoints: z.number(),
            }),
        )
        .query(({ input }) => {
            return userMethods.getByEmail(input.email);
        }),

    editUser: restProcedure
        .meta({
            openapi: {
                method: 'PUT',
                path: '/users/edit',
            },
        })
        .input(
            z.object({
                email: z.string(),
                name: z.string().optional(),
                supervisorId: z.string().nullish(),
            }),
        )
        .output(
            z.object({
                id: z.string(),
                name: z.string().nullable(),
                email: z.string(),
                supervisorId: z.string().nullable(),
            }),
        )
        .mutation(async ({ input }) => {
            const { email, ...restInput } = input;
            const user = await userMethods.getByEmail(email);
            return userMethods.edit({ id: user.id, ...restInput });
        }),

    editUserActiveState: restProcedure
        .meta({
            openapi: {
                method: 'PUT',
                path: '/users/edit-active',
            },
        })
        .input(
            z.object({
                email: z.string(),
                active: z.boolean(),
            }),
        )
        .output(
            z.object({
                id: z.string(),
                name: z.string().nullable(),
                email: z.string(),
                active: z.boolean(),
            }),
        )
        .mutation(async ({ input }) => {
            const user = await userMethods.getByEmail(input.email);
            return userMethods.editActiveState({ id: user.id, active: input.active });
        }),

    changeUserBonusPoints: restProcedure
        .meta({
            openapi: {
                method: 'PUT',
                path: '/users/bonus',
            },
        })
        .input(
            changeBonusPointsSchema.omit({ userId: true }).extend({
                targetUserEmail: z.string(),
                actingUserEmail: z.string(),
            }),
        )
        .output(
            z.object({
                id: z.string(),
                name: z.string().nullable(),
                email: z.string(),
                bonusPoints: z.number(),
            }),
        )
        .mutation(async ({ input }) => {
            const { actingUserEmail, targetUserEmail, ...restInput } = input;
            const targetUser = await userMethods.getByEmail(targetUserEmail);
            const actingUser = await userMethods.getByEmail(actingUserEmail);
            return bonusPointsMethods.change({ userId: targetUser.id, ...restInput }, actingUser);
        }),

    getGroupById: restProcedure
        .meta({
            openapi: {
                method: 'POST',
                path: '/groups/info',
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
                method: 'GET',
                path: '/groups/list',
            },
        })
        .input(
            z.object({
                search: z.string().optional(),
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
});
