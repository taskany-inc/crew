import { getUsersOfGroup } from '../../api-client/users/user-api-hook';
import { protectedProcedure, router } from '../trpcBackend';
import { getUsersOfGroupIdSchema } from '../../schema/users-of-group-type';

export const usersOfGroupIdRouter = router({
    getById: protectedProcedure.input(getUsersOfGroupIdSchema).query(({ input }) => {
        return getUsersOfGroup(input.groupId);
    }),
});
