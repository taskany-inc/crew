import { router } from '../trpcBackend';

import { groupRouter } from './groupRouter';
import { userRouter } from './userRouter';
import { feedbackRouter } from './feedbackRouter';
import { searchRouter } from './searchRouter';
import { serviceRouter } from './serviceRouter';
import { roleRouter } from './roleRouter';

export const trpcRouter = router({
    user: userRouter,
    group: groupRouter,
    feedback: feedbackRouter,
    search: searchRouter,
    service: serviceRouter,
    role: roleRouter,
});

export type TrpcRouter = typeof trpcRouter;
