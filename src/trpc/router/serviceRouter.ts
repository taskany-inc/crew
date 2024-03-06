import { z } from 'zod';

import { accessCheck } from '../../utils/access';
import { protectedProcedure, router } from '../trpcBackend';
import { serviceMethods } from '../../modules/serviceMethods';
import { userAccess } from '../../modules/userAccess';
import { createServiceSchema, deleteUserServiceSchema, getServiceListSchema } from '../../modules/serviceSchemas';

export const serviceRouter = router({
    getList: protectedProcedure.input(getServiceListSchema).query(({ input }) => {
        return serviceMethods.getList(input);
    }),

    addToUser: protectedProcedure.input(createServiceSchema).mutation(({ input, ctx }) => {
        accessCheck(userAccess.isEditable(ctx.session.user, input.userId));
        return serviceMethods.addToUser(input);
    }),

    getUserServices: protectedProcedure.input(z.string()).query(({ input }) => {
        return serviceMethods.getUserServices(input);
    }),

    deleteUserService: protectedProcedure.input(deleteUserServiceSchema).mutation(({ input, ctx }) => {
        accessCheck(userAccess.isEditable(ctx.session.user, input.userId));
        return serviceMethods.deleteUserService(input);
    }),
});
