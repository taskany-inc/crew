import { protectedProcedure, router } from '../trpcBackend';
import { accessCheck, accessCheckAnyOf, checkRoleForAccess } from '../../utils/access';
import {
    cancelScheduledDeactivationSchema,
    createScheduledDeactivationSchema,
    editScheduledDeactivationSchema,
} from '../../modules/scheduledDeactivationSchemas';
import { scheduledDeactivationMethods } from '../../modules/scheduledDeactivationMethods';
import { historyEventMethods } from '../../modules/historyEventMethods';
import { scheduledDeactivationHistoryEvent } from '../../utils/scheduledDeactivationHistoryEvent';
import { dropUnchangedValuesFromEvent } from '../../utils/dropUnchangedValuesFromEvents';

export const scheduledDeactivationRouter = router({
    create: protectedProcedure.input(createScheduledDeactivationSchema).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editScheduledDeactivation'));

        const result = await scheduledDeactivationMethods.create({ ...input }, ctx.session.user.id);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'createScheduledDeactivation', {
            groupId: undefined,
            userId: result.userId,
            before: undefined,
            after: scheduledDeactivationHistoryEvent(result),
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
    edit: protectedProcedure.input(editScheduledDeactivationSchema).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editScheduledDeactivation'));

        const scheduledDeactivationBefore = await scheduledDeactivationMethods.getById(input.id);
        const historyEventsBefore = scheduledDeactivationHistoryEvent(scheduledDeactivationBefore);

        const result = await scheduledDeactivationMethods.edit({ ...input }, ctx.session.user.id);
        const historyEventsAfter = scheduledDeactivationHistoryEvent(result);

        const { before, after } = dropUnchangedValuesFromEvent(historyEventsBefore, historyEventsAfter);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'editScheduledDeactivation', {
            groupId: undefined,
            userId: result.userId,
            before,
            after,
        });
        return result;
    }),
    cancel: protectedProcedure.input(cancelScheduledDeactivationSchema).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editScheduledDeactivation'));

        const result = await scheduledDeactivationMethods.cancel({ ...input });
        await historyEventMethods.create({ user: ctx.session.user.id }, 'cancelScheduledDeactivation', {
            groupId: undefined,
            userId: result.userId,
            before: undefined,
            after: { type: result.type, comment: input.comment },
        });
        return result;
    }),
});
