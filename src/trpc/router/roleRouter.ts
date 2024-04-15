import { protectedProcedure, router } from '../trpcBackend';
import { roleMethods } from '../../modules/roleMethods';
import {
    addRoleToMembershipSchema,
    getRoleListSchema,
    removeRoleFromMembershipSchema,
    getRoleSuggestionsSchema,
} from '../../modules/roleSchemas';
import { accessCheckAnyOf, checkRoleForAccess } from '../../utils/access';

export const roleRouter = router({
    addToMembership: protectedProcedure.input(addRoleToMembershipSchema).mutation(({ input, ctx }) => {
        accessCheckAnyOf(
            checkRoleForAccess(ctx.session.user.role, 'editFullGroupTree'),
            checkRoleForAccess(ctx.session.user.role, 'editAdministratedGroupTree'),
        );
        return roleMethods.addToMembership(input);
    }),

    removeFromMembership: protectedProcedure.input(removeRoleFromMembershipSchema).mutation(({ input, ctx }) => {
        accessCheckAnyOf(
            checkRoleForAccess(ctx.session.user.role, 'editFullGroupTree'),
            checkRoleForAccess(ctx.session.user.role, 'editAdministratedGroupTree'),
        );
        return roleMethods.removeFromMembership(input);
    }),

    getList: protectedProcedure.input(getRoleListSchema).query(({ input }) => {
        return roleMethods.getList(input);
    }),

    suggestions: protectedProcedure.input(getRoleSuggestionsSchema).query(({ input }) => {
        return roleMethods.suggestions(input);
    }),
});
