import { protectedProcedure, router } from '../trpcBackend';
import { roleMethods } from '../../modules/roleMethods';
import {
    addRoleToMembershipSchema,
    getRoleListSchema,
    removeRoleFromMembershipSchema,
    getRoleSuggestionsSchema,
} from '../../modules/roleSchemas';
import { accessCheck } from '../../utils/access';
import { roleAccess } from '../../modules/roleAccess';

export const roleRouter = router({
    addToMembership: protectedProcedure.input(addRoleToMembershipSchema).mutation(({ input, ctx }) => {
        accessCheck(roleAccess.create(ctx.session.user));
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
