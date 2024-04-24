import { protectedProcedure, router } from '../trpcBackend';
import {
    createAndGiveAchievementSchema,
    getAchievementListSchema,
    giveAchievementSchema,
} from '../../modules/achievementSchemas';
import { achievementMethods } from '../../modules/achievementMethods';
import { accessCheck, checkRoleForAccess } from '../../utils/access';
import { historyEventMethods } from '../../modules/historyEventMethods';

export const achievementRouter = router({
    createAndGive: protectedProcedure.input(createAndGiveAchievementSchema).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editUserAchievements'));
        const result = await achievementMethods.createAndGive(input, ctx.session.user.id);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'createAchievement', {
            groupId: undefined,
            userId: undefined,
            before: undefined,
            after: { id: result.id, title: result.title, description: result.description, hidden: result.hidden },
        });
        await historyEventMethods.create({ user: ctx.session.user.id }, 'giveAchievementToUser', {
            groupId: undefined,
            userId: input.userId,
            before: undefined,
            after: { id: result.id, title: result.title },
        });
        return result;
    }),

    give: protectedProcedure.input(giveAchievementSchema).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editUserAchievements'));
        const achievement = await achievementMethods.getById(input.achievementId);
        const result = await achievementMethods.give(input, ctx.session.user.id);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'giveAchievementToUser', {
            groupId: undefined,
            userId: input.userId,
            before: undefined,
            after: { id: achievement.id, title: achievement.title, amount: input.amount },
        });
        return result;
    }),

    getList: protectedProcedure.input(getAchievementListSchema).query(({ input }) => {
        return achievementMethods.getList(input);
    }),
});
