import { z } from 'zod';

import { accessCheckAnyOf, checkRoleForAccess } from '../../utils/access';
import { router, protectedProcedure } from '../trpcBackend';
import {
    createGroupSchema,
    editGroupSchema,
    getGroupListSchema,
    moveGroupSchema,
    getGroupSuggestionsSchema,
} from '../../modules/groupSchemas';
import { groupMethods } from '../../modules/groupMethods';

export const groupRouter = router({
    create: protectedProcedure.input(createGroupSchema).mutation(({ input, ctx }) => {
        accessCheckAnyOf(
            checkRoleForAccess(ctx.session.user.role, 'editFullGroupTree'),
            checkRoleForAccess(ctx.session.user.role, 'editAdministratedGroupTree'),
        );
        return groupMethods.create(input, ctx.session.user);
    }),

    edit: protectedProcedure.input(editGroupSchema).mutation(async ({ input, ctx }) => {
        accessCheckAnyOf(
            checkRoleForAccess(ctx.session.user.role, 'editFullGroupTree'),
            checkRoleForAccess(ctx.session.user.role, 'editAdministratedGroupTree'),
        );
        return groupMethods.edit(input);
    }),

    archive: protectedProcedure.input(z.string()).mutation(({ input, ctx }) => {
        accessCheckAnyOf(
            checkRoleForAccess(ctx.session.user.role, 'editFullGroupTree'),
            checkRoleForAccess(ctx.session.user.role, 'editAdministratedGroupTree'),
        );
        return groupMethods.archive(input);
    }),

    delete: protectedProcedure.input(z.string()).mutation(({ input, ctx }) => {
        accessCheckAnyOf(
            checkRoleForAccess(ctx.session.user.role, 'editFullGroupTree'),
            checkRoleForAccess(ctx.session.user.role, 'editAdministratedGroupTree'),
        );
        return groupMethods.delete(input);
    }),

    move: protectedProcedure.input(moveGroupSchema).mutation(({ input, ctx }) => {
        accessCheckAnyOf(
            checkRoleForAccess(ctx.session.user.role, 'editFullGroupTree'),
            checkRoleForAccess(ctx.session.user.role, 'editAdministratedGroupTree'),
        );
        return groupMethods.move(input);
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

    getBreadcrumbs: protectedProcedure.input(z.string()).query(({ input }) => {
        return groupMethods.getBreadcrumbs(input);
    }),

    getMemberships: protectedProcedure.input(z.string()).query(({ input, ctx }) => {
        return groupMethods.getMemberships(input, ctx.session.user);
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
});
