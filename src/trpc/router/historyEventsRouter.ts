import { historyEventMethods } from '../../modules/historyEventMethods';
import { getUserActivitySchema } from '../../modules/historyEventSchemas';
import { userAccess } from '../../modules/userAccess';
import { accessCheck, checkRoleForAccess } from '../../utils/access';
import { protectedProcedure, router } from '../trpcBackend';

export const historyEventRouter = router({
    getUserActivity: protectedProcedure.input(getUserActivitySchema).query(({ input, ctx }) => {
        accessCheck(userAccess.isActivityViewable(ctx.session.user, input.userId));
        return historyEventMethods.getUserActivity(input);
    }),
    getUserChanges: protectedProcedure.input(getUserActivitySchema).query(({ input, ctx }) => {
        checkRoleForAccess(ctx.session.user.role, 'viewHistoryEvents');
        return historyEventMethods.getUserChanges(input);
    }),
});
