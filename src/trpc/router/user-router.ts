import { z } from 'zod';

import { protectedProcedure, router } from '../trpcBackend';
import { userMethods } from '../../modules/user.methods';
import { addUserToGroupSchema, getUserListSchema, removeUserFromGroupSchema } from '../../modules/user.schemas';

export const userRouter = router({
    addToGroup: protectedProcedure.input(addUserToGroupSchema).mutation(({ input }) => {
        return userMethods.addToGroup(input);
    }),

    removeFromGroup: protectedProcedure.input(removeUserFromGroupSchema).mutation(({ input }) => {
        return userMethods.removeFromGroup(input);
    }),

    getById: protectedProcedure.input(z.string()).query(({ input, ctx }) => {
        return userMethods.getById(input, ctx.session.user);
    }),

    getList: protectedProcedure.input(getUserListSchema).query(({ input }) => {
        return userMethods.getList(input);
    }),

    getMemberships: protectedProcedure.input(z.string()).query(({ input }) => {
        return userMethods.getMemberships(input);
    }),

    getGroupMembers: protectedProcedure.input(z.string()).query(({ input }) => {
        return userMethods.getGroupMembers(input);
    }),
});
