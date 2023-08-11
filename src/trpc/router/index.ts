import { router } from '../trpcBackend';

import { useGroupRouter } from './group-router';
import { useUserRouter } from './user-router';
import { usersOfGroupRouter } from './users-of-group-router';

export const trpcRouter = router({
    usersOfGroup: usersOfGroupRouter,
    user: useUserRouter,
    group: useGroupRouter,
});

export type TrpcRouter = typeof trpcRouter;
