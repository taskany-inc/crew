import { z } from 'zod';

import { accessCheck } from '../../utils/access';
import { protectedProcedure, router } from '../trpcBackend';
import { userMethods } from '../../modules/userMethods';
import {
    addUserToGroupSchema,
    editUserSchema,
    editUserSettingsSchema,
    getUserListSchema,
    removeUserFromGroupSchema,
    getUserSuggestionsSchema,
    createUserSchema,
    editUserActiveStateSchema,
} from '../../modules/userSchemas';
import { userAccess } from '../../modules/userAccess';
import { globalAccess } from '../../modules/globalAccess';
import { groupAccess } from '../../modules/groupAccess';

export const userRouter = router({
    create: protectedProcedure.input(createUserSchema).mutation(({ input, ctx }) => {
        accessCheck(globalAccess.user.create(ctx.session.user.role));
        return userMethods.create(input);
    }),

    addToGroup: protectedProcedure.input(addUserToGroupSchema).mutation(({ input, ctx }) => {
        accessCheck(groupAccess.isEditable(ctx.session.user));
        return userMethods.addToGroup(input);
    }),

    removeFromGroup: protectedProcedure.input(removeUserFromGroupSchema).mutation(({ input, ctx }) => {
        accessCheck(groupAccess.isEditable(ctx.session.user));
        return userMethods.removeFromGroup(input);
    }),

    editSettings: protectedProcedure.input(editUserSettingsSchema).mutation(({ input, ctx }) => {
        return userMethods.editSettings(ctx.session.user.id, input);
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

    edit: protectedProcedure.input(editUserSchema).mutation(({ input, ctx }) => {
        accessCheck(userAccess.isEditable(ctx.session.user, input.id));
        return userMethods.edit(input);
    }),

    editActiveState: protectedProcedure.input(editUserActiveStateSchema).mutation(({ input, ctx }) => {
        accessCheck(userAccess.isActiveStateEditable(ctx.session.user));
        return userMethods.editActiveState(input);
    }),

    getAvailableMembershipPercentage: protectedProcedure.input(z.string()).query(({ input }) => {
        return userMethods.getAvailableMembershipPercentage(input);
    }),

    suggestions: protectedProcedure.input(getUserSuggestionsSchema).query(({ input }) => {
        return userMethods.suggestions(input);
    }),
});
