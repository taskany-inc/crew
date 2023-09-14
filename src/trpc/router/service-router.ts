import { userServicesMethods } from '../../modules/service.method';
import { createServiceSchema, getServiceListSchema } from '../../modules/service.schemas';
import { protectedProcedure, router } from '../trpcBackend';

export const serviceRouter = router({
    getList: protectedProcedure.input(getServiceListSchema).query(({ input }) => {
        return userServicesMethods.getList(input);
    }),
    addToUser: protectedProcedure.input(createServiceSchema).mutation(({ input }) => {
        return userServicesMethods.addToUser(input);
    }),
});
