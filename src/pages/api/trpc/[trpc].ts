import * as trpcNext from '@trpc/server/adapters/next';

import { trpcRouter } from '../../../trpc/router';
import { createContext } from '../../../trpc/trpcContext';

export default trpcNext.createNextApiHandler({
    router: trpcRouter,
    createContext,
});
