import { z } from 'zod';

import { accessCheck } from '../../utils/access';
import { router, protectedProcedure } from '../trpcBackend';
import {
    createGroupSchema,
    editGroupSchema,
    getGroupListSchema,
    moveGroupSchema,
    getGroupSuggestionsSchema,
} from '../../modules/groupSchemas';
import { groupMethods } from '../../modules/groupMethods';
import { groupAccess } from '../../modules/groupAccess';
import { globalAccess } from '../../modules/globalAccess';

export const groupRouter = router({
    create: protectedProcedure.input(createGroupSchema).mutation(({ input, ctx }) => {
        accessCheck(globalAccess.group.create(ctx.session.user.role));
        return groupMethods.create(input);
    }),

    edit: protectedProcedure.input(editGroupSchema).mutation(({ input, ctx }) => {
        accessCheck(groupAccess.isEditable(ctx.session.user));
        return groupMethods.edit(input);
    }),

    archive: protectedProcedure.input(z.string()).mutation(({ input, ctx }) => {
        accessCheck(groupAccess.isEditable(ctx.session.user));
        return groupMethods.archive(input);
    }),

    delete: protectedProcedure.input(z.string()).mutation(({ input, ctx }) => {
        accessCheck(groupAccess.isEditable(ctx.session.user));
        return groupMethods.delete(input);
    }),

    move: protectedProcedure.input(moveGroupSchema).mutation(({ input, ctx }) => {
        accessCheck(groupAccess.isEditable(ctx.session.user));
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
