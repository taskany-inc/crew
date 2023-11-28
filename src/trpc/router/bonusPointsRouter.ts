import { z } from 'zod';

import { bonusPointsMethods } from '../../modules/bonusPointsMethods';
import { changeBonusPointsSchema, getAchievementsSchema } from '../../modules/bonusPointsSchemas';
import { userAccess } from '../../modules/userAccess';
import { accessCheck } from '../../utils/access';
import { protectedProcedure, router } from '../trpcBackend';

export const bonusPointsRouter = router({
    change: protectedProcedure.input(changeBonusPointsSchema).mutation(({ input, ctx }) => {
        accessCheck(userAccess.isBonusEditable(ctx.session.user));
        return bonusPointsMethods.change(input, ctx.session.user);
    }),

    getHistory: protectedProcedure.input(z.string()).query(({ input, ctx }) => {
        accessCheck(userAccess.isBonusViewable(ctx.session.user, input));
        return bonusPointsMethods.getHistory(input);
    }),

    getAchievements: protectedProcedure.input(getAchievementsSchema).query(({ input }) => {
        return bonusPointsMethods.getAchievements(input);
    }),
});
