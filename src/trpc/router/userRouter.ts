import { z } from 'zod';

import { accessCheck } from '../../utils/access';
import { protectedProcedure, router } from '../trpcBackend';
import { userMethods } from '../../modules/userMethods';
import {
    addUserToGroupSchema,
    changeBonusPointsSchema,
    editUserSchema,
    editUserSettingsSchema,
    getUserListSchema,
    removeUserFromGroupSchema,
} from '../../modules/userSchemas';
import { userAccess } from '../../modules/userAccess';

export const userRouter = router({
    addToGroup: protectedProcedure.input(addUserToGroupSchema).mutation(({ input }) => {
        return userMethods.addToGroup(input);
    }),

    removeFromGroup: protectedProcedure.input(removeUserFromGroupSchema).mutation(({ input }) => {
        return userMethods.removeFromGroup(input);
    }),

    editSettings: protectedProcedure.input(editUserSettingsSchema).mutation(({ input, ctx }) => {
        return userMethods.editSettings(ctx.session.user.id, input);
    }),

    changeBonusPoints: protectedProcedure.input(changeBonusPointsSchema).mutation(({ input, ctx }) => {
        accessCheck(userAccess.isBonusEditable(ctx.session.user));
        return userMethods.changeBonusPoints(input, ctx.session.user);
    }),

    getById: protectedProcedure.input(z.string()).query(({ input, ctx }) => {
        return userMethods.getById(input, ctx.session.user);
    }),

    getSettings: protectedProcedure.query(({ ctx }) => {
        return userMethods.getSettings(ctx.session.user.id);
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

    edit: protectedProcedure.input(editUserSchema).mutation(({ input, ctx }) => {
        accessCheck(userAccess.isEditable(ctx.session.user, input.id));
        return userMethods.edit(input);
    }),
});
