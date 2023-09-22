import { roleMethods } from '../../modules/role.methods';
import {
    addRoleToMembershipSchema,
    createRoleSchema,
    getRoleListSchema,
    removeRoleFromMembershipSchema,
} from '../../modules/role.schemas';
import { protectedProcedure, router } from '../trpcBackend';

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
});
