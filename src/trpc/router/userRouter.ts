import { z } from 'zod';
import { TRPCError } from '@trpc/server';

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

        const userBeforeWithCurators = await prisma.user.findUnique({
            where: { id: input.id },
            include: { curators: true },
        });
        if (!userBeforeWithCurators) throw new TRPCError({ code: 'NOT_FOUND', message: `No user with id ${input.id}` });
        const result = await userMethods.edit(input);

        const userAfterWithCurators = await prisma.user.findUnique({
            where: { id: input.id },
            select: { curators: { select: { id: true } } },
        });

        const { before, after } = dropUnchangedValuesFromEvent(
            {
                name: userBeforeWithCurators.name,
                supervisorId: userBeforeWithCurators.supervisorId,
                organizationalUnitId: userBeforeWithCurators.organizationUnitId ?? undefined,
                email: userBeforeWithCurators.email,
                savePreviousName: input.savePreviousName,
                curatorIds: userBeforeWithCurators.curators.map(({ id }) => id),
            },
            {
                name: result.name,
                supervisorId: result.supervisorId,
                organizationalUnitId: result.organizationUnitId ?? undefined,
                email: result.email,
                curatorIds: userAfterWithCurators?.curators.map(({ id }) => id),
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
        processEvent({
            eventType: 'userActiveUpdate',
            url: headers.referer || '',
            session,
            uaHeader: headers['user-agent'],
            additionalData: {
                userId: result.id,
                before: userBefore.active.toString(),
                after: result.active.toString(),
            },
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
