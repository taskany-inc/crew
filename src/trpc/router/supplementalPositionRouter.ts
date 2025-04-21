import { supplementalPositionMethods } from '../../modules/supplementalPositionMethods';
import { accessCheck, checkRoleForAccess } from '../../utils/access';
import { protectedProcedure, router } from '../trpcBackend';
import { userAccess } from '../../modules/userAccess';
import { historyEventMethods } from '../../modules/historyEventMethods';
import {
    addSupplementalPositionToUserSchema,
    createSupplementalPositionRequestSchema,
    removeSupplementalPositionFromUserSchema,
    updateSupplementalPositionRequestSchema,
} from '../../modules/supplementalPositionSchema';
import { handleUserCreationRequest } from '../../modules/userCreationRequestSchemas';
import { newSupplementalPositionHistoryEvent } from '../../utils/userCreationRequestHistoryEvents';
import { dropUnchangedValuesFromEvent } from '../../utils/dropUnchangedValuesFromEvents';
import { userCreationRequestsMethods } from '../../modules/userCreationRequestMethods';

export const supplementalPositionRouter = router({
    addToUser: protectedProcedure.input(addSupplementalPositionToUserSchema).mutation(async ({ input, ctx }) => {
        accessCheck(userAccess.isEditable(ctx.session.user, input.userId));
        const result = await supplementalPositionMethods.addToUser(input);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'addSupplementalPositionToUser', {
            groupId: undefined,
            userId: input.userId,
            before: undefined,
            after: { organizationUnitId: result.organizationUnitId, percentage: result.percentage },
        });

        return result;
    }),

    removeFromUser: protectedProcedure
        .input(removeSupplementalPositionFromUserSchema)
        .mutation(async ({ input, ctx }) => {
            accessCheck(userAccess.isEditable(ctx.session.user, input.userId));
            const result = await supplementalPositionMethods.removeFromUser(input);

            await historyEventMethods.create({ user: ctx.session.user.id }, 'removeSupplementalPositionFromUser', {
                groupId: undefined,
                userId: input.userId,
                before: undefined,
                after: { organizationUnitId: result.organizationUnitId, percentage: result.percentage },
            });

            return result;
        }),

    createRequest: protectedProcedure
        .input(createSupplementalPositionRequestSchema())
        .mutation(async ({ input, ctx }) => {
            accessCheck(checkRoleForAccess(ctx.session.user.role, 'editUserActiveState'));
            const request = await supplementalPositionMethods.createRequest(input, ctx.session.user.id);

            await historyEventMethods.create({ user: ctx.session.user.id }, 'createSupplementalPositionRequest', {
                groupId: undefined,
                userId: input.userTargetId,
                before: undefined,
                after: newSupplementalPositionHistoryEvent(request),
            });
        }),

    cancelRequest: protectedProcedure.input(handleUserCreationRequest).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editUserActiveState'));
        const canceledRequestTargetUserId = await supplementalPositionMethods.cancelRequest(input);

        await historyEventMethods.create({ user: ctx.session.user.id }, 'cancelSupplementalPositionRequest', {
            userId: canceledRequestTargetUserId,
            groupId: undefined,
            before: undefined,
            after: { id: input.id, comment: input.comment },
        });
    }),

    updateRequest: protectedProcedure
        .input(updateSupplementalPositionRequestSchema())
        .mutation(async ({ input, ctx }) => {
            accessCheck(checkRoleForAccess(ctx.session.user.role, 'editUserActiveState'));

            const requestBefore = await userCreationRequestsMethods.getSupplementalPositionRequestById(input.id);

            const request = await supplementalPositionMethods.updateRequest(input);

            const { before, after } = dropUnchangedValuesFromEvent(
                newSupplementalPositionHistoryEvent(requestBefore),
                newSupplementalPositionHistoryEvent(request),
            );

            await historyEventMethods.create({ user: ctx.session.user.id }, 'editSupplementalPositionRequest', {
                userId: input.userTargetId,
                groupId: undefined,
                before: { ...before, id: request.id },
                after: { ...after, id: request.id },
            });
        }),
});
