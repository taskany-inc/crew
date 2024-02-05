import { z } from 'zod';

import { restProcedure, router } from '../trpcBackend';
import { userMethods } from '../../modules/userMethods';
import { changeBonusPointsSchema } from '../../modules/bonusPointsSchemas';
import { bonusPointsMethods } from '../../modules/bonusPointsMethods';

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
});
