import { z } from 'zod';

import { protectedProcedure, router } from '../trpcBackend';
import { searchMethods } from '../../modules/searchMethods';

export const searchRouter = router({
    global: protectedProcedure.input(z.string()).query(({ input }) => {
        return searchMethods.global(input);
    }),
});
