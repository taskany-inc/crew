import { protectedProcedure, router } from '../trpcBackend';
import { userRoleMethods } from '../../modules/userRoleMethods';
import { accessCheck, checkRoleForAccess } from '../../utils/access';
import { addScopeToRoleSchema, getUserRoleWithScopeSchema } from '../../modules/userRoleSchemas';

export const userRoleRouter = router({
    getListWithScope: protectedProcedure.input(getUserRoleWithScopeSchema).query(({ input }) => {
        return userRoleMethods.getListWithScope(input);
    }),

    addScopeToRole: protectedProcedure.input(addScopeToRoleSchema).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editRoleScopes'));
        const result = await userRoleMethods.addScopeToRole(input);
        return result;
    }),
});
