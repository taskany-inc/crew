import { groupPercentageMethods } from '../../modules/groupPercentageMethods';
import { updateMembershipPercentageSchema } from '../../modules/percentageSchemas';
import { protectedProcedure, router } from '../trpcBackend';

export const percentageRouter = router({
    update: protectedProcedure.input(updateMembershipPercentageSchema).mutation(async ({ input }) => {
        return groupPercentageMethods.update(input);
    }),
});
