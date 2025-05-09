import { z } from 'zod';

import { protectedProcedure, router } from '../trpcBackend';
import { accessCheck, accessCheckAnyOf, checkRoleForAccess } from '../../utils/access';
import {
    cancelScheduledDeactivationSchema,
    createScheduledDeactivationSchema,
    editScheduledDeactivationSchema,
    getScheduledDeactivationListSchema,
} from '../../modules/scheduledDeactivationSchemas';
import { scheduledDeactivationMethods } from '../../modules/scheduledDeactivationMethods';
import { historyEventMethods } from '../../modules/historyEventMethods';
import { scheduledDeactivationHistoryEvent } from '../../utils/scheduledDeactivationHistoryEvent';
import { dropUnchangedValuesFromEvent } from '../../utils/dropUnchangedValuesFromEvents';
import { getOrgUnitTitle } from '../../utils/organizationUnit';
import { isFuture, isPast, isSameDay, supplementalPositionsDate } from '../../utils/dateTime';
import { userMethods } from '../../modules/userMethods';

export const scheduledDeactivationRouter = router({
    create: protectedProcedure.input(createScheduledDeactivationSchema()).mutation(async ({ input, ctx }) => {
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
    getList: protectedProcedure.input(getScheduledDeactivationListSchema).query(({ ctx, input }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'viewScheduledDeactivation'));
        const creatorId =
            ctx.session.user.role?.editScheduledDeactivation && !ctx.session.user.role.viewScheduledDeactivation
                ? ctx.session.user.id
                : undefined;

        return scheduledDeactivationMethods.getList({ ...input, creatorId });
    }),
    getById: protectedProcedure.input(z.string()).query(({ ctx, input }) => {
        accessCheckAnyOf(
            checkRoleForAccess(ctx.session.user.role, 'editScheduledDeactivation'),
            checkRoleForAccess(ctx.session.user.role, 'viewScheduledDeactivation'),
        );
        return scheduledDeactivationMethods.getById(input);
    }),
    edit: protectedProcedure.input(editScheduledDeactivationSchema()).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editScheduledDeactivation'));

        const scheduledDeactivationBefore = await scheduledDeactivationMethods.getById(input.id);
        const historyEventsBefore = scheduledDeactivationHistoryEvent(scheduledDeactivationBefore);

        const deactivateDateBefore = supplementalPositionsDate(
            scheduledDeactivationBefore.supplementalPositions,
            'workEndDate',
        );
        const deactivateDateAfter = supplementalPositionsDate(input.supplementalPositions, 'workEndDate');
        if (
            !isSameDay(deactivateDateBefore, deactivateDateAfter) &&
            isPast(deactivateDateBefore) &&
            isFuture(deactivateDateAfter)
        ) {
            await userMethods.editActiveState({ id: input.userId, active: true });
        }

        const result = await scheduledDeactivationMethods.edit({ ...input }, ctx.session.user.id);
        const historyEventsAfter = scheduledDeactivationHistoryEvent(result);

        const { before, after } = dropUnchangedValuesFromEvent(historyEventsBefore, historyEventsAfter);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'editScheduledDeactivation', {
            groupId: undefined,
            userId: result.userId,
            before,
            after: {
                ...after,
                type: result.type,
                newOrganization: result.newOrganizationUnit ? getOrgUnitTitle(result.newOrganizationUnit) : undefined,
            },
        });
        return result;
    }),
    cancel: protectedProcedure.input(cancelScheduledDeactivationSchema).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editScheduledDeactivation'));

        const result = await scheduledDeactivationMethods.cancel({ ...input }, ctx.session.user.id);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'cancelScheduledDeactivation', {
            groupId: undefined,
            userId: result.userId,
            before: undefined,
            after: { type: result.type, comment: input.comment },
        });
        return result;
    }),
});
