import { router } from '../trpcBackend';

import { groupRouter } from './groupRouter';
import { userRouter } from './userRouter';
import { feedbackRouter } from './feedbackRouter';
import { searchRouter } from './searchRouter';
import { serviceRouter } from './serviceRouter';
import { roleRouter } from './roleRouter';
import { deviceRouter } from './deviceRouter';

export const trpcRouter = router({
    user: userRouter,
    group: groupRouter,
    feedback: feedbackRouter,
    search: searchRouter,
    service: serviceRouter,
    role: roleRouter,
    device: deviceRouter,
});

export type TrpcRouter = typeof trpcRouter;
