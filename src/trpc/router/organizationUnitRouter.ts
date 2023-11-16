import { organizationUnitMethods } from '../../modules/organizationUnitMethods';
import { getOrganizationUnitListSchema } from '../../modules/organizationUnitSchemas';
import { protectedProcedure, router } from '../trpcBackend';

export const organizationUnitRouter = router({
    getList: protectedProcedure.input(getOrganizationUnitListSchema).query(({ input }) => {
        return organizationUnitMethods.getList(input);
    }),
});
