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

export const groupRouter = router({
    add: protectedProcedure.input(createGroupSchema).mutation(({ input }) => {
        return groupMethods.add(input);
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

    move: protectedProcedure.input(moveGroupSchema).mutation(({ input }) => {
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

    getMemberships: protectedProcedure.input(z.string()).query(({ input }) => {
        return groupMethods.getMemberships(input);
    }),

    getHierarchy: protectedProcedure.input(z.string()).query(({ input }) => {
        return groupMethods.getHierarchy(input);
    }),

    suggestions: protectedProcedure.input(getGroupSuggestionsSchema).query(({ input }) => {
        return groupMethods.suggestions(input);
    }),
});
