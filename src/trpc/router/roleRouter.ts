import { protectedProcedure, router } from '../trpcBackend';
import { roleMethods } from '../../modules/roleMethods';
import {
    addRoleToMembershipSchema,
    createRoleSchema,
    getRoleListSchema,
    removeRoleFromMembershipSchema,
    getRoleSuggestionsSchema,
} from '../../modules/roleSchemas';

export const roleRouter = router({
    add: protectedProcedure.input(createRoleSchema).mutation(({ input }) => {
        return roleMethods.add(input);
    }),

    addToMembership: protectedProcedure.input(addRoleToMembershipSchema).mutation(({ input }) => {
        return roleMethods.addToMembership(input);
    }),

    removeFromMembership: protectedProcedure.input(removeRoleFromMembershipSchema).mutation(({ input }) => {
        return roleMethods.removeFromMembership(input);
    }),

    getList: protectedProcedure.input(getRoleListSchema).query(({ input }) => {
        return roleMethods.getList(input);
    }),

    suggestions: protectedProcedure.input(getRoleSuggestionsSchema).query(({ input }) => {
        return roleMethods.suggestions(input);
    }),
});
