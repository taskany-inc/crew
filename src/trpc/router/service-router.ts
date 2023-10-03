import { userServicesMethods } from '../../modules/service.method';
import { createServiceSchema, getServiceListSchema } from '../../modules/service.schemas';
import { userAccess } from '../../modules/user.access';
import { accessCheck } from '../../utils/access';
import { protectedProcedure, router } from '../trpcBackend';

export const serviceRouter = router({
    getList: protectedProcedure.input(getServiceListSchema).query(({ input }) => {
        return userServicesMethods.getList(input);
    }),

    addToUser: protectedProcedure.input(createServiceSchema).mutation(({ input, ctx }) => {
        accessCheck(userAccess.isEditable(ctx.session.user, input.userId));
        return userServicesMethods.addToUser(input);
    }),
});
