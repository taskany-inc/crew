import { router, protectedProcedure } from '../trpcBackend';
import { hireIntegrationMethods } from '../../modules/hireIntegrationMethods';

export const hireIntegrationRouter = router({
    getHireStreamList: protectedProcedure.query(() => {
        return hireIntegrationMethods.getHireStreams();
    }),
});
