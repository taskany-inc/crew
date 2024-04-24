import { z } from 'zod';

import { bonusPointsMethods } from '../../modules/bonusPointsMethods';
import { changeBonusPointsSchema, getAchievementsSchema } from '../../modules/bonusPointsSchemas';
import { accessCheck, accessCheckAnyOf, checkRoleForAccess } from '../../utils/access';
import { protectedProcedure, router } from '../trpcBackend';
import { historyEventMethods } from '../../modules/historyEventMethods';
import { userMethods } from '../../modules/userMethods';

export const bonusPointsRouter = router({
    change: protectedProcedure.input(changeBonusPointsSchema).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editUserBonuses'));
        const userBefore = await userMethods.getByIdOrThrow(input.userId);
        const result = await bonusPointsMethods.change(input, ctx.session.user.id);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'editUserBonuses', {
            groupId: undefined,
            userId: result.id,
            before: { amount: userBefore.bonusPoints },
            after: { amount: result.bonusPoints, description: input.description },
        });
        return result;
    }),

    getHistory: protectedProcedure.input(z.string()).query(({ input, ctx }) => {
        if (input !== ctx.session.user.id) {
            accessCheckAnyOf(
                checkRoleForAccess(ctx.session.user.role, 'viewUserBonuses'),
                checkRoleForAccess(ctx.session.user.role, 'editUserBonuses'),
            );
        }
        return bonusPointsMethods.getHistory(input);
    }),

    getAchievements: protectedProcedure.input(getAchievementsSchema).query(({ input }) => {
        return bonusPointsMethods.getAchievements(input);
    }),
});
