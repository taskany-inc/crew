import { router } from '../trpcBackend';

import { useGroupChildrenRouter } from './children-router';
import { useGroupRouter } from './group-router';
import { useUserRouter } from './user-router';
import { usersOfGroupRouter } from './users-of-group-router';

export const trpcRouter = router({
    usersOfGroup: usersOfGroupRouter,
    user: useUserRouter,
    group: useGroupRouter,
    groupChildren: useGroupChildrenRouter,
});

export type TrpcRouter = typeof trpcRouter;
