import { router, protectedProcedure } from '../trpcBackend';
import { hireIntegrationMethods } from '../../modules/hireIntegrationMethods';
import { getHireStreamRecruitersSchema } from '../../modules/hireIntegrationTypes';

export const hireIntegrationRouter = router({
    getHireStreamList: protectedProcedure.query(() => {
        return hireIntegrationMethods.getHireStreams();
    }),

    getHireStreamRecruiters: protectedProcedure.input(getHireStreamRecruitersSchema).query(({ input }) => {
        return hireIntegrationMethods.getHireStreamRecruiters(input);
    }),
});
