import { z } from 'zod';

import { restProcedure, router } from '../trpcBackend';
import { userMethods } from '../../modules/userMethods';
import { changeBonusPointsSchema } from '../../modules/bonusPointsSchemas';
import { bonusPointsMethods } from '../../modules/bonusPointsMethods';
import { groupMethods } from '../../modules/groupMethods';
import { vacancyMethods } from '../../modules/vacancyMethods';

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
                method: 'GET',
                path: '/groups/info',
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
                        }),
                        roles: z.array(
                            z.object({
                                name: z.string(),
                            }),
                        ),
                        percentage: z.number().nullable(),
                    }),
                ),
                breadcrumbs: z.array(
                    z.object({
                        id: z.string(),
                        name: z.string(),
                    }),
                ),
            }),
        )
        .query(async ({ input }) => {
            const [group, memberships, breadcrumbs] = await Promise.all([
                groupMethods.getById(input.id),
                groupMethods.getMemberships(input.id),
                groupMethods.getBreadcrumbs(input.id),
            ]);
            return { ...group, memberships, breadcrumbs };
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
            }),
        )
        .query(({ input }) => vacancyMethods.getById(input.id)),

    getVacancyList: restProcedure
        .meta({
            openapi: {
                method: 'GET',
                path: '/vacancies/list',
            },
        })
        .input(
            z.object({
                hireStreamId: z.string(),
                searchByTeam: z.string().optional(),
            }),
        )
        .output(
            z.array(
                z.object({
                    id: z.string(),
                    name: z.string(),
                    group: z.object({ id: z.string(), name: z.string() }),
                    hireStreamId: z.string(),
                }),
            ),
        )
        .query(({ input }) => vacancyMethods.getList(input)),
});
