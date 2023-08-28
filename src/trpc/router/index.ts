import { router } from '../trpcBackend';

import { groupRouter } from './group-router';
import { userRouter } from './user-router';

export const trpcRouter = router({
    user: userRouter,
    group: groupRouter,
});

export type TrpcRouter = typeof trpcRouter;
