import { router } from '../trpcBackend';

import { groupRouter } from './group-router';
import { userRouter } from './user-router';
import { feedbackRouter } from './feedback-router';

export const trpcRouter = router({
    user: userRouter,
    group: groupRouter,
    feedback: feedbackRouter,
});

export type TrpcRouter = typeof trpcRouter;
