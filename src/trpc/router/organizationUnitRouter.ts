import { z } from 'zod';

import { organizationUnitMethods } from '../../modules/organizationUnitMethods';
import { getOrganizationUnitListSchema } from '../../modules/organizationUnitSchemas';
import { protectedProcedure, router } from '../trpcBackend';

export const organizationUnitRouter = router({
    getList: protectedProcedure.input(getOrganizationUnitListSchema).query(({ input }) => {
        return organizationUnitMethods.getList(input);
    }),
    getAll: protectedProcedure
        .input(
            z
                .object({
                    hideEmpty: z.boolean(),
                })
                .optional(),
        )
        .query(async ({ input }) => {
            return organizationUnitMethods.getAll(input?.hideEmpty);
        }),
    getCountsByOrgUnitIds: protectedProcedure.input(z.array(z.string())).query(async ({ input }) => {
        const counts = await organizationUnitMethods.membershipCountByOrgIds(input);

        return counts.reduce<Record<string, { memberships: number }>>((acc, value) => {
            acc[value.id] = {
                memberships: value.count,
            };

            return acc;
        }, {});
    }),
});
