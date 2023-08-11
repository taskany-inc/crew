import { router, publicProcedure } from '../trpcBackend';
import { getGroup } from '../../api-client/groups/group-api-hook';
import { getGroupIdSchema } from '../../schema/group-types';

export const useGroupRouter = router({
    getById: publicProcedure.input(getGroupIdSchema).query(({ input }) => {
        return getGroup(input.groupId);
    }),
});
