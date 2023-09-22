import { z } from 'zod';

import { router, protectedProcedure } from '../trpcBackend';
import { createGroupSchema, getGroupListSchema, moveGroupSchema } from '../../modules/group.schemas';
import { groupMethods } from '../../modules/group.methods';

export const groupRouter = router({
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

    getList: protectedProcedure.input(getGroupListSchema).query(({ input }) => {
        return groupMethods.getList(input);
    }),

    getBreadcrumbs: protectedProcedure.input(z.string()).query(({ input }) => {
        return groupMethods.getBreadCrumbs(input);
    }),

    getMemberships: protectedProcedure.input(z.string()).query(({ input }) => {
        return groupMethods.getMemberships(input);
    }),

    getHierarchy: protectedProcedure.input(z.string()).query(({ input }) => {
        return groupMethods.getHierarchy(input);
    }),
});
