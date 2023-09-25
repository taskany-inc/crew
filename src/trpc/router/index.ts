import { router } from '../trpcBackend';

import { groupRouter } from './group-router';
import { userRouter } from './user-router';
import { feedbackRouter } from './feedback-router';
import { searchRouter } from './search-router';
import { serviceRouter } from './service-router';
import { roleRouter } from './role-router';

export const trpcRouter = router({
    user: userRouter,
    group: groupRouter,
    feedback: feedbackRouter,
    search: searchRouter,
    service: serviceRouter,
    role: roleRouter,
});

export type TrpcRouter = typeof trpcRouter;
