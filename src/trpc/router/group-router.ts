import { z } from 'zod';

import { router, protectedProcedure } from '../trpcBackend';
import { getGroup, getGroupChildren } from '../../api-client/groups/group-methods';
import { getGroupGhildrenSchema, getGroupSchema } from '../../api-client/groups/group-schemas';
import { createGroupSchema, moveGroupSchema } from '../../modules/group.schemas';
import { groupMethods } from '../../modules/group.methods';

export const groupRouter = router({
    getById: protectedProcedure.input(getGroupSchema).query(({ input }) => {
        return getGroup(input.groupId);
    }),

    getChildren: protectedProcedure.input(getGroupGhildrenSchema).query(({ input }) => {
        return getGroupChildren(input.id);
    }),
});

export const groupNewRouter = router({
    add: protectedProcedure.input(createGroupSchema).mutation(({ input }) => {
        return groupMethods.add(input);
    }),

    delete: protectedProcedure.input(z.string()).mutation(({ input }) => {
        return groupMethods.delete(input);
    }),

    move: protectedProcedure.input(moveGroupSchema).mutation(({ input }) => {
        return groupMethods.move(input);
    }),

    getRoots: protectedProcedure.query(() => {
        return groupMethods.getRoots();
    }),

    getById: protectedProcedure.input(z.string()).query(({ input }) => {
        return groupMethods.getById(input);
    }),

    getChildren: protectedProcedure.input(z.string()).query(({ input }) => {
        return groupMethods.getChildren(input);
    }),

    getByIdWithChildren: protectedProcedure.input(z.string()).query(({ input }) => {
        return groupMethods.getByIdWithChildren(input);
    }),

    getBreadcrumbs: protectedProcedure.input(z.string()).query(({ input }) => {
        return groupMethods.getBreadCrumbs(input);
    }),

    getMembers: protectedProcedure.input(z.string()).query(({ input }) => {
        return groupMethods.getMembers(input);
    }),

    getHierarchy: protectedProcedure.input(z.string()).query(({ input }) => {
        return groupMethods.getHierarchy(input);
    }),
});
