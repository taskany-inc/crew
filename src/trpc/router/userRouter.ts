import { z } from 'zod';

import { accessCheck, checkRoleForAccess } from '../../utils/access';
import { protectedProcedure, router } from '../trpcBackend';
import { userMethods } from '../../modules/userMethods';
import {
    addUserToGroupSchema,
    editUserFieldsSchema,
    editUserSettingsSchema,
    getUserListSchema,
    removeUserFromGroupSchema,
    getUserSuggestionsSchema,
    createUserSchema,
    editUserActiveStateSchema,
    editUserRoleSchema,
    editUserMailingSettingsSchema,
    updateMembershipPercentageSchema,
} from '../../modules/userSchemas';
import { historyEventMethods } from '../../modules/historyEventMethods';
import { dropUnchangedValuesFromEvent } from '../../utils/dropUnchangedValuesFromEvents';
import { groupAccess } from '../../modules/groupAccess';
import { prisma } from '../../utils/prisma';
import { processEvent } from '../../utils/analyticsEvent';

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
        accessCheck(await groupAccess.isEditable(ctx.session.user, input.groupId));

        const result = await userMethods.addToGroup(input);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'addUserToGroup', {
            groupId: result.groupId,
            userId: result.userId,
            before: undefined,
            after: { percentage: result.percentage || undefined },
        });
        return result;
    }),

    updatePercentage: protectedProcedure.input(updateMembershipPercentageSchema).mutation(async ({ input, ctx }) => {
        accessCheck(await groupAccess.isEditable(ctx.session.user, input.groupId));

        const membership = await prisma.membership.findUnique({
            where: { id: input.membershipId },
        });

        const result = await userMethods.updatePercentage(input);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'editMembershipPercentage', {
            groupId: result.groupId,
            userId: result.userId,
            before: membership?.percentage || undefined,
            after: result.percentage || undefined,
        });
        return result;
    }),

    removeFromGroup: protectedProcedure.input(removeUserFromGroupSchema).mutation(async ({ input, ctx }) => {
        accessCheck(await groupAccess.isEditable(ctx.session.user, input.groupId));

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

    editMailingSettings: protectedProcedure.input(editUserMailingSettingsSchema).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editUser'));
        const result = await userMethods.editMailingSettings(input);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'editUserMailingSettings', {
            groupId: undefined,
            userId: result.userId,
            before: undefined,
            after: {
                type: input.type,
                value: result[input.type],
                organizationUnitId: result.organizationUnitId || undefined,
            },
        });
        return result;
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

    edit: protectedProcedure.input(editUserFieldsSchema).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editUser'));
        const userBefore = await userMethods.getByIdOrThrow(input.id);
        const result = await userMethods.edit(input);
        const { before, after } = dropUnchangedValuesFromEvent(
            {
                name: userBefore.name,
                supervisorId: userBefore.supervisorId,
                organizationalUnitId: userBefore.organizationUnitId ?? undefined,
                email: userBefore.email,
            },
            {
                name: result.name,
                supervisorId: result.supervisorId,
                organizationalUnitId: result.organizationUnitId ?? undefined,
                email: result.email,
            },
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

        const { session, headers } = ctx;
        processEvent('userActiveUpdate', headers.referer || '', session, headers['user-agent'], {
            userId: result.id,
            before: userBefore.active.toString(),
            after: result.active.toString(),
        });

        return result;
    }),

    getAvailableMembershipPercentage: protectedProcedure.input(z.string()).query(({ input }) => {
        return userMethods.getAvailableMembershipPercentage(input);
    }),

    suggestions: protectedProcedure.input(getUserSuggestionsSchema).query(({ input }) => {
        return userMethods.suggestions(input);
    }),

    editUserRole: protectedProcedure.input(editUserRoleSchema).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editUserRole'));
        const userBefore = await userMethods.getByIdOrThrow(input.id);
        const result = await userMethods.editUserRole(input);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'editUserRole', {
            userId: result.id,
            groupId: undefined,
            before: { roleCode: userBefore.roleCode || undefined },
            after: { roleCode: result.roleCode || undefined },
        });
        return result;
    }),

    isLoginUnique: protectedProcedure.input(z.string()).query(({ input }) => {
        return userMethods.isLoginUnique(input);
    }),
});
