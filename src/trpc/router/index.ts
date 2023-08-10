import { router } from '../trpcBackend';

import { usersOfGroupIdRouter } from './users-of-group-router';

export const trpcRouter = router({
    usersOfGroup: usersOfGroupIdRouter,
});

export type TrpcRouter = typeof trpcRouter;
