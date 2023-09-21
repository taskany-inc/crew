import { z } from 'zod';

import { protectedProcedure, router } from '../trpcBackend';
import { searchMethods } from '../../modules/search.methods';

export const searchRouter = router({
    global: protectedProcedure.input(z.string()).query(({ input }) => {
        return searchMethods.global(input);
    }),
});
