import { router, publicProcedure } from '../trpcBackend';
import { getGroupChildren } from '../../api-client/groups/group-api-hook';
import { getGroupGhildrenIdSchema } from '../../schema/children-types';

export const useGroupChildrenRouter = router({
    getById: publicProcedure.input(getGroupGhildrenIdSchema).query(({ input }) => {
        return getGroupChildren(input.id);
    }),
});
