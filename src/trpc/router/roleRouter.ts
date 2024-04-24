import { protectedProcedure, router } from '../trpcBackend';
import { roleMethods } from '../../modules/roleMethods';
import {
    addRoleToMembershipSchema,
    getRoleListSchema,
    removeRoleFromMembershipSchema,
    getRoleSuggestionsSchema,
} from '../../modules/roleSchemas';
import { accessCheckAnyOf, checkRoleForAccess } from '../../utils/access';
import { historyEventMethods } from '../../modules/historyEventMethods';

export const roleRouter = router({
    addToMembership: protectedProcedure.input(addRoleToMembershipSchema).mutation(async ({ input, ctx }) => {
        accessCheckAnyOf(
            checkRoleForAccess(ctx.session.user.role, 'editFullGroupTree'),
            checkRoleForAccess(ctx.session.user.role, 'editAdministratedGroupTree'),
        );
        const roleName = input.type === 'existing' ? (await roleMethods.getByIdOrThrow(input.id)).name : input.name;
        const result = await roleMethods.addToMembership(input);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'addRoleToMembership', {
            groupId: result.groupId,
            userId: result.userId,
            before: undefined,
            after: roleName,
        });
        return result;
    }),

    removeFromMembership: protectedProcedure.input(removeRoleFromMembershipSchema).mutation(async ({ input, ctx }) => {
        accessCheckAnyOf(
            checkRoleForAccess(ctx.session.user.role, 'editFullGroupTree'),
            checkRoleForAccess(ctx.session.user.role, 'editAdministratedGroupTree'),
        );
        const role = await roleMethods.getByIdOrThrow(input.roleId);
        const result = await roleMethods.removeFromMembership(input);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'removeRoleFromMembership', {
            groupId: result.groupId,
            userId: result.userId,
            before: undefined,
            after: role.name,
        });
        return result;
    }),

    getList: protectedProcedure.input(getRoleListSchema).query(({ input }) => {
        return roleMethods.getList(input);
    }),

    suggestions: protectedProcedure.input(getRoleSuggestionsSchema).query(({ input }) => {
        return roleMethods.suggestions(input);
    }),
});
