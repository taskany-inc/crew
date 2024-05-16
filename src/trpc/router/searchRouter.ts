import { z } from 'zod';
import { translit } from '@taskany/bricks';

import { protectedProcedure, router } from '../trpcBackend';
import { searchMethods } from '../../modules/searchMethods';

export const searchRouter = router({
    global: protectedProcedure.input(z.string()).query(({ input }) => {
        const translitInput = translit(input);
        return searchMethods.global(input, translitInput);
    }),
});
