import { z } from 'zod';

import { protectedProcedure, router } from '../trpcBackend';
import { userMethods } from '../../modules/user.methods';
import {
    addUserToGroupSchema,
    changeBonusPointsSchema,
    getUserListSchema,
    removeUserFromGroupSchema,
} from '../../modules/user.schemas';
import { accessCheck } from '../../utils/access';
import { userAccess } from '../../modules/user.access';

export const userRouter = router({
    addToGroup: protectedProcedure.input(addUserToGroupSchema).mutation(({ input }) => {
        return userMethods.addToGroup(input);
    }),

    removeFromGroup: protectedProcedure.input(removeUserFromGroupSchema).mutation(({ input }) => {
        return userMethods.removeFromGroup(input);
    }),

    changeBonusPoints: protectedProcedure.input(changeBonusPointsSchema).mutation(({ input, ctx }) => {
        accessCheck(userAccess.isBonusEditable(ctx.session.user));
        return userMethods.changeBonusPoints(input, ctx.session.user);
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

    getBonusPointsHistory: protectedProcedure.input(z.string()).query(({ input, ctx }) => {
        accessCheck(userAccess.isBonusHistoryViewable(ctx.session.user, input));
        return userMethods.getBonusPointsHistory(input);
    }),
});
