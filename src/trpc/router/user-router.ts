import { protectedProcedure, router } from '../trpcBackend';
import { getUser, getUsersOfGroup } from '../../api-client/users/user-methods';
import { getUserSchema, getUsersOfGroupSchema } from '../../api-client/users/user-schemas';

export const userRouter = router({
    getById: protectedProcedure.input(getUserSchema).query(({ input }) => {
        return getUser(input.userId);
    }),

    getUsersOfGroup: protectedProcedure.input(getUsersOfGroupSchema).query(({ input }) => {
        return getUsersOfGroup(input.groupId);
    }),
});
