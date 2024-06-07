import { z } from 'zod';

import { router, protectedProcedure } from '../trpcBackend';
import {
    createGroupSchema,
    editGroupSchema,
    getGroupListSchema,
    moveGroupSchema,
    getGroupSuggestionsSchema,
    addOrRemoveUserFromGroupAdminsSchema,
} from '../../modules/groupSchemas';
import { groupMethods } from '../../modules/groupMethods';
import { historyEventMethods } from '../../modules/historyEventMethods';
import { dropUnchangedValuesFromEvent } from '../../utils/dropUnchangedValuesFromEvents';
import { groupAccess } from '../../modules/groupAccess';
import { accessCheck, accessCheckAnyOf, checkRoleForAccess } from '../../utils/access';

export const groupRouter = router({
    create: protectedProcedure.input(createGroupSchema).mutation(async ({ input, ctx }) => {
        accessCheckAnyOf(
            checkRoleForAccess(ctx.session.user.role, 'editFullGroupTree'),
            checkRoleForAccess(ctx.session.user.role, 'editAdministratedGroupTree'),
        );
        const result = await groupMethods.create(input, ctx.session.user);

        await historyEventMethods.create({ user: ctx.session.user.id }, 'createGroup', {
            groupId: result.id,
            userId: undefined,
            before: undefined,
            after: {
                name: result.name,
                parentId: result.parentId || undefined,
                virtual: result.virtual,
                organizational: result.organizational,
            },
        });
        return result;
    }),

    edit: protectedProcedure.input(editGroupSchema).mutation(async ({ input, ctx }) => {
        accessCheck(await groupAccess.isEditable(ctx.session.user, input.groupId));

        const groupBefore = await groupMethods.getByIdOrThrow(input.groupId);
        const result = await groupMethods.edit(input);
        const { before, after } = dropUnchangedValuesFromEvent(
            {
                name: groupBefore.name,
                description: groupBefore.description,
                organizational: groupBefore.organizational,
                supervisorId: groupBefore.supervisorId,
            },
            {
                name: result.name,
                description: result.description,
                organizational: result.organizational,
                supervisorId: result.supervisorId,
            },
        );
        await historyEventMethods.create({ user: ctx.session.user.id }, 'editGroup', {
            groupId: result.id,
            userId: undefined,
            before,
            after,
        });
        return result;
    }),

    archive: protectedProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
        accessCheck(await groupAccess.isEditable(ctx.session.user, input));

        const result = await groupMethods.archive(input);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'archiveGroup', {
            groupId: result.id,
            userId: undefined,
            before: undefined,
            after: undefined,
        });
        return result;
    }),

    delete: protectedProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
        accessCheck(await groupAccess.isEditable(ctx.session.user, input));

        const result = await groupMethods.delete(input);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'deleteGroup', {
            groupId: result.id,
            userId: undefined,
            before: undefined,
            after: undefined,
        });
        return result;
    }),

    move: protectedProcedure.input(moveGroupSchema).mutation(async ({ input, ctx }) => {
        accessCheck(await groupAccess.isEditable(ctx.session.user, input.id));

        const groupBefore = await groupMethods.getByIdOrThrow(input.id);
        const result = await groupMethods.move(input);
        if (groupBefore.parentId !== result.parentId) {
            await historyEventMethods.create({ user: ctx.session.user.id }, 'moveGroup', {
                groupId: result.id,
                userId: undefined,
                before: groupBefore.parentId || undefined,
                after: result.parentId || undefined,
            });
        }
        return result;
    }),

    getRoots: protectedProcedure.query(() => {
        return groupMethods.getRoots();
    }),

    getById: protectedProcedure.input(z.string()).query(({ input, ctx }) => {
        return groupMethods.getById(input, ctx.session.user);
    }),

    getChildren: protectedProcedure.input(z.string()).query(({ input }) => {
        return groupMethods.getChildren(input);
    }),

    getList: protectedProcedure.input(getGroupListSchema).query(({ input }) => {
        return groupMethods.getList(input);
    }),

    getUserList: protectedProcedure.input(getGroupListSchema).query(({ input, ctx }) => {
        return groupMethods.getUserList(ctx.session.user.id, input);
    }),

    getBreadcrumbs: protectedProcedure.input(z.string()).query(({ input }) => {
        return groupMethods.getBreadcrumbs(input);
    }),

    getMemberships: protectedProcedure.input(z.string()).query(async ({ input, ctx }) => {
        return groupMethods.getMemberships(input, ctx.session.user);
    }),

    getTreeMembershipsCount: protectedProcedure.input(z.string()).query(({ input }) => {
        return groupMethods.getTreeMembershipsCount(input);
    }),

    getHierarchy: protectedProcedure.input(z.string()).query(({ input }) => {
        return groupMethods.getHierarchy(input);
    }),

    exportMembers: protectedProcedure.input(z.string()).mutation(({ input }) => {
        return groupMethods.exportMembers(input);
    }),

    suggestions: protectedProcedure.input(getGroupSuggestionsSchema).query(({ input }) => {
        return groupMethods.suggestions(input);
    }),
    addUserToGroupAdmin: protectedProcedure
        .input(addOrRemoveUserFromGroupAdminsSchema)
        .mutation(async ({ input, ctx }) => {
            accessCheck(await groupAccess.isEditable(ctx.session.user, input.groupId));

            const result = await groupMethods.addUserToGroupAdmins(input);

            await historyEventMethods.create({ user: ctx.session.user.id }, 'addUserToGroupAdmin', {
                groupId: result.groupId,
                userId: result.userId,
                before: undefined,
                after: undefined,
            });

            return result;
        }),

    getGroupAdmins: protectedProcedure.input(z.string()).query(async ({ input }) => {
        return groupMethods.getGroupAdmins(input);
    }),

    removeUserFromGroupAdmin: protectedProcedure
        .input(addOrRemoveUserFromGroupAdminsSchema)
        .mutation(async ({ input, ctx }) => {
            accessCheck(await groupAccess.isEditable(ctx.session.user, input.groupId));

            const result = await groupMethods.removeUserFromGroupAdmins(input);

            await historyEventMethods.create({ user: ctx.session.user.id }, 'removeUserFromGroupAdmin', {
                groupId: result.groupId,
                userId: result.userId,
                before: undefined,
                after: undefined,
            });

            return result;
        }),
});
