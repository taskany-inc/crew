import { router, protectedProcedure } from '../trpcBackend';
import { getGroup, getGroupChildren } from '../../api-client/groups/group-methods';
import { getGroupGhildrenSchema, getGroupSchema } from '../../api-client/groups/group-schemas';

export const groupRouter = router({
    getById: protectedProcedure.input(getGroupSchema).query(({ input }) => {
        return getGroup(input.groupId);
    }),

    getChildren: protectedProcedure.input(getGroupGhildrenSchema).query(({ input }) => {
        return getGroupChildren(input.id);
    }),
});
