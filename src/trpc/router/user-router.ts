import { publicProcedure, router } from '../trpcBackend';
import { getUserIdSchema } from '../../schema/user-types';
import { getUser } from '../../api-client/users/user-api-hook';

export const useUserRouter = router({
    getById: publicProcedure.input(getUserIdSchema).query(({ input }) => {
        return getUser(input.userId);
    }),
});
