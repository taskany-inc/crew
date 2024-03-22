import { accessCheck } from '../../utils/access';
import { protectedProcedure, router } from '../trpcBackend';
import {
    createAndGiveAchievementSchema,
    getAchievementListSchema,
    giveAchievementSchema,
} from '../../modules/achievementSchemas';
import { achievementMethods } from '../../modules/achievementMethods';
import { globalAccess } from '../../modules/globalAccess';

export const achievementRouter = router({
    createAndGive: protectedProcedure.input(createAndGiveAchievementSchema).mutation(({ input, ctx }) => {
        accessCheck(globalAccess.achievement.create(ctx.session.user.role));
        return achievementMethods.createAndGive({ ...input }, ctx.session.user.id);
    }),
    give: protectedProcedure.input(giveAchievementSchema).mutation(({ input, ctx }) => {
        accessCheck(globalAccess.achievement.create(ctx.session.user.role));
        return achievementMethods.give({ ...input }, ctx.session.user.id);
    }),
    getList: protectedProcedure.input(getAchievementListSchema).query(({ input }) => {
        return achievementMethods.getList(input);
    }),
});
