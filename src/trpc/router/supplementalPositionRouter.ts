import { supplementalPositionMethods } from '../../modules/supplementalPositionMethods';
import { accessCheck } from '../../utils/access';
import { protectedProcedure, router } from '../trpcBackend';
import { userAccess } from '../../modules/userAccess';
import { historyEventMethods } from '../../modules/historyEventMethods';
import {
    addSupplementalPositionToUserSchema,
    createSupplementalPositionRequestSchema,
    removeSupplementalPositionFromUserSchema,
} from '../../modules/supplementalPositionSchema';

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
            accessCheck(userAccess.isEditable(ctx.session.user, input.userTargetId));
            await supplementalPositionMethods.createRequest(input, ctx.session.user.id);

            // TODO history event
        }),
});
