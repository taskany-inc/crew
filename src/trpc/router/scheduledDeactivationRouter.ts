import { protectedProcedure, router } from '../trpcBackend';
import { accessCheck, accessCheckAnyOf, checkRoleForAccess } from '../../utils/access';
import { createScheduledDeactivationSchema } from '../../modules/scheduledDeactivationSchemas';
import { scheduledDeactivationMethods } from '../../modules/scheduledDeactivationMethods';
import { historyEventMethods } from '../../modules/historyEventMethods';

export const scheduledDeactivationRouter = router({
    create: protectedProcedure.input(createScheduledDeactivationSchema).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editScheduledDeactivation'));

        const result = await scheduledDeactivationMethods.create({ ...input }, ctx.session.user.id);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'createScheduledDeactivation', {
            groupId: undefined,
            userId: result.userId,
            before: undefined,
            after: input,
        });
        return result;
    }),
    getList: protectedProcedure.query(({ ctx }) => {
        accessCheckAnyOf(
            checkRoleForAccess(ctx.session.user.role, 'editScheduledDeactivation'),
            checkRoleForAccess(ctx.session.user.role, 'viewScheduledDeactivation'),
        );
        return scheduledDeactivationMethods.getList(
            ctx.session.user.role?.editScheduledDeactivation && !ctx.session.user.role.viewScheduledDeactivation
                ? ctx.session.user.id
                : undefined,
        );
    }),
});
