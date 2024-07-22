import { protectedProcedure, router } from '../trpcBackend';
import { userRoleMethods } from '../../modules/userRoleMethods';
import { accessCheck, checkRoleForAccess } from '../../utils/access';
import { changeRoleScope, getUserRoleWithScopeSchema } from '../../modules/userRoleSchemas';
import { historyEventMethods } from '../../modules/historyEventMethods';

export const userRoleRouter = router({
    getListWithScope: protectedProcedure.input(getUserRoleWithScopeSchema).query(({ input }) => {
        return userRoleMethods.getListWithScope(input);
    }),

    changeRoleScope: protectedProcedure.input(changeRoleScope).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editRoleScopes'));
        const result = await userRoleMethods.changeRoleScope(input);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'changeUserRoleScope', {
            groupId: undefined,
            userId: undefined,
            before: undefined,
            after: {
                roleCode: input.code,
                scope: input.scope.field,
                value: input.scope.value,
            },
        });
        return result;
    }),
});
