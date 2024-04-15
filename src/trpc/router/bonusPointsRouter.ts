import { z } from 'zod';

import { bonusPointsMethods } from '../../modules/bonusPointsMethods';
import { changeBonusPointsSchema, getAchievementsSchema } from '../../modules/bonusPointsSchemas';
import { accessCheck, accessCheckAnyOf, checkRoleForAccess } from '../../utils/access';
import { protectedProcedure, router } from '../trpcBackend';

export const bonusPointsRouter = router({
    change: protectedProcedure.input(changeBonusPointsSchema).mutation(({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editUserBonuses'));
        return bonusPointsMethods.change(input, ctx.session.user.id);
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
