import { z } from 'zod';

import { accessCheck, accessCheckAnyOf, checkRoleForAccess } from '../../utils/access';
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
import { historyEventMethods } from '../../modules/historyEventMethods';
import { dropUnchangedValuesFromEvent } from '../../utils/dropUnchangedValuesFromEvents';

export const userRouter = router({
    create: protectedProcedure.input(createUserSchema).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'createUser'));
        const result = await userMethods.create(input);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'createUser', {
            groupId: undefined,
            userId: result.id,
            before: undefined,
            after: {
                name: result.name || undefined,
                email: result.email,
                phone: input.phone,
                login: input.login,
                organizationalUnitId: result.organizationUnitId || input.organizationUnitId,
                accountingId: input.accountingId,
                supervisorId: result.supervisorId || undefined,
                createExternalAccount: input.createExternalAccount,
            },
        });
        if (input.groupId) {
            await historyEventMethods.create({ user: ctx.session.user.id }, 'addUserToGroup', {
                groupId: input.groupId,
                userId: result.id,
                before: undefined,
                after: {},
            });
        }
        return result;
    }),

    addToGroup: protectedProcedure.input(addUserToGroupSchema).mutation(async ({ input, ctx }) => {
        accessCheckAnyOf(
            checkRoleForAccess(ctx.session.user.role, 'editFullGroupTree'),
            checkRoleForAccess(ctx.session.user.role, 'editAdministratedGroupTree'),
        );
        const result = await userMethods.addToGroup(input);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'addUserToGroup', {
            groupId: result.groupId,
            userId: result.userId,
            before: undefined,
            after: { percentage: result.percentage || undefined },
        });
        return result;
    }),

    removeFromGroup: protectedProcedure.input(removeUserFromGroupSchema).mutation(async ({ input, ctx }) => {
        accessCheckAnyOf(
            checkRoleForAccess(ctx.session.user.role, 'editFullGroupTree'),
            checkRoleForAccess(ctx.session.user.role, 'editAdministratedGroupTree'),
        );
        const result = await userMethods.removeFromGroup(input);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'removeUserFromGroup', {
            groupId: result.groupId,
            userId: result.userId,
            before: undefined,
            after: undefined,
        });
        return result;
    }),

    editSettings: protectedProcedure.input(editUserSettingsSchema).mutation(({ input, ctx }) => {
        return userMethods.editSettings(ctx.session.user.id, input);
    }),

    getById: protectedProcedure.input(z.string()).query(({ input, ctx }) => {
        return userMethods.getById(input, ctx.session.user);
    }),

    getByLogin: protectedProcedure.input(z.string()).query(({ input, ctx }) => {
        return userMethods.getByLogin(input, ctx.session.user);
    }),

    getSettings: protectedProcedure.query(({ ctx }) => {
        return userMethods.getSettings(ctx.session.user.id);
    }),

    getList: protectedProcedure.input(getUserListSchema).query(({ input }) => {
        return userMethods.getList(input);
    }),

    getMemberships: protectedProcedure.input(z.string()).query(({ input, ctx }) => {
        return userMethods.getMemberships(input, ctx.session.user);
    }),

    getGroupMembers: protectedProcedure.input(z.string()).query(({ input }) => {
        return userMethods.getGroupMembers(input);
    }),

    edit: protectedProcedure.input(editUserSchema).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editUser'));
        const userBefore = await userMethods.getByIdOrThrow(input.id);
        const result = await userMethods.edit(input);
        const { before, after } = dropUnchangedValuesFromEvent(
            { name: userBefore.name, supervisorId: userBefore.supervisorId },
            { name: result.name, supervisorId: result.supervisorId },
        );
        await historyEventMethods.create({ user: ctx.session.user.id }, 'editUser', {
            groupId: undefined,
            userId: result.id,
            before,
            after,
        });
        return result;
    }),

    editActiveState: protectedProcedure.input(editUserActiveStateSchema).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editUserActiveState'));
        const userBefore = await userMethods.getByIdOrThrow(input.id);
        const result = await userMethods.editActiveState(input);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'editUserActiveState', {
            userId: result.id,
            groupId: undefined,
            before: userBefore.active,
            after: result.active,
        });
        return result;
    }),

    getAvailableMembershipPercentage: protectedProcedure.input(z.string()).query(({ input }) => {
        return userMethods.getAvailableMembershipPercentage(input);
    }),

    suggestions: protectedProcedure.input(getUserSuggestionsSchema).query(({ input }) => {
        return userMethods.suggestions(input);
    }),
});
