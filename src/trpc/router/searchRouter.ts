import { z } from 'zod';
import { translit } from '@taskany/bricks';

import { protectedProcedure, router } from '../trpcBackend';
import { searchMethods } from '../../modules/searchMethods';
import { processEvent } from '../../utils/analyticsEvent';

export const searchRouter = router({
    global: protectedProcedure.input(z.string()).query(({ input, ctx }) => {
        const { session, headers } = ctx;
        processEvent('searchQuery', headers.referer || '', session, headers['user-agent'], { query: input });

        const translitInput = translit(input);
        return searchMethods.global(input, translitInput);
    }),
});
