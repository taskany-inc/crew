import { historyEventMethods } from '../../modules/historyEventMethods';
import { getUserActivitySchema } from '../../modules/historyEventSchemas';
import { protectedProcedure, router } from '../trpcBackend';

export const historyEventRouter = router({
    getUserActivity: protectedProcedure.input(getUserActivitySchema).query(({ input }) => {
        return historyEventMethods.getUserActivity(input);
    }),
});
