import { router } from '../trpcBackend';

import { groupNewRouter, groupRouter } from './group-router';
import { userRouter } from './user-router';
import { feedbackRouter } from './feedback-router';

export const trpcRouter = router({
    user: userRouter,
    group: groupRouter,
    groupNew: groupNewRouter,
    feedback: feedbackRouter,
});

export type TrpcRouter = typeof trpcRouter;
