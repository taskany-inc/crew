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
