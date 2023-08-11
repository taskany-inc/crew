import { getUsersOfGroup } from '../../api-client/users/user-api-hook';
import { publicProcedure, router } from '../trpcBackend';
import { getUsersOfGroupIdSchema } from '../../schema/users-of-group-type';

export const usersOfGroupRouter = router({
    getById: publicProcedure.input(getUsersOfGroupIdSchema).query(({ input }) => {
        return getUsersOfGroup(input.groupId);
    }),
});
