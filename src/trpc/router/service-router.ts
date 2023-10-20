import { z } from 'zod';

import { serviceMethods } from '../../modules/service.methods';
import { userAccess } from '../../modules/user.access';
import { accessCheck } from '../../utils/access';
import { createServiceSchema, getServiceListSchema } from '../../modules/service.schemas';
import { protectedProcedure, router } from '../trpcBackend';

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
});
