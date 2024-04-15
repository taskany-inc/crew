import { protectedProcedure, router } from '../trpcBackend';
import {
    createAndGiveAchievementSchema,
    getAchievementListSchema,
    giveAchievementSchema,
} from '../../modules/achievementSchemas';
import { achievementMethods } from '../../modules/achievementMethods';
import { accessCheck, checkRoleForAccess } from '../../utils/access';

export const achievementRouter = router({
    createAndGive: protectedProcedure.input(createAndGiveAchievementSchema).mutation(({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editUserAchievements'));
        return achievementMethods.createAndGive({ ...input }, ctx.session.user.id);
    }),

    give: protectedProcedure.input(giveAchievementSchema).mutation(({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editUserAchievements'));
        return achievementMethods.give({ ...input }, ctx.session.user.id);
    }),

    getList: protectedProcedure.input(getAchievementListSchema).query(({ input }) => {
        return achievementMethods.getList(input);
    }),
});
