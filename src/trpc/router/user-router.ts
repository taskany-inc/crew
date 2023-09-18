import { z } from 'zod';

import { protectedProcedure, router } from '../trpcBackend';
import { userMethods } from '../../modules/user.methods';
import { addUserToGroupSchema } from '../../modules/user.schemas';

export const userRouter = router({
    addToGroup: protectedProcedure.input(addUserToGroupSchema).mutation(({ input }) => {
        return userMethods.addToGroup(input);
    }),

    getById: protectedProcedure.input(z.string()).query(({ input }) => {
        return userMethods.getById(input);
    }),

    getList: protectedProcedure.query(() => {
        return userMethods.getList();
    }),

    getMemberships: protectedProcedure.input(z.string()).query(({ input }) => {
        return userMethods.getMemberships(input);
    }),

    getGroupMembers: protectedProcedure.input(z.string()).query(({ input }) => {
        return userMethods.getGroupMembers(input);
    }),
});
