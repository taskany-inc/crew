import { protectedProcedure, router } from '../trpcBackend';
import { groupRoleMethods } from '../../modules/groupRoleMethods';
import {
    addRoleToMembershipSchema,
    getRoleListSchema,
    removeRoleFromMembershipSchema,
    getRoleSuggestionsSchema,
} from '../../modules/roleSchemas';
import { historyEventMethods } from '../../modules/historyEventMethods';
import { accessToFullGroupAndAdministratedGroup } from '../../modules/groupAccess';

export const roleRouter = router({
    addToMembership: protectedProcedure.input(addRoleToMembershipSchema).mutation(async ({ input, ctx }) => {
        const roleName =
            input.type === 'existing' ? (await groupRoleMethods.getByIdOrThrow(input.id)).name : input.name;
        const result = await groupRoleMethods.addToMembership(input);
        await accessToFullGroupAndAdministratedGroup(ctx.session.user, result.groupId);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'addRoleToMembership', {
            groupId: result.groupId,
            userId: result.userId,
            before: undefined,
            after: roleName,
        });
        return result;
    }),

    removeFromMembership: protectedProcedure.input(removeRoleFromMembershipSchema).mutation(async ({ input, ctx }) => {
        const role = await groupRoleMethods.getByIdOrThrow(input.roleId);
        const result = await groupRoleMethods.removeFromMembership(input);
        await accessToFullGroupAndAdministratedGroup(ctx.session.user, result.groupId);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'removeRoleFromMembership', {
            groupId: result.groupId,
            userId: result.userId,
            before: undefined,
            after: role.name,
        });
        return result;
    }),

    getList: protectedProcedure.input(getRoleListSchema).query(({ input }) => {
        return groupRoleMethods.getList(input);
    }),

    suggestions: protectedProcedure.input(getRoleSuggestionsSchema).query(({ input }) => {
        return groupRoleMethods.suggestions(input);
    }),
});
