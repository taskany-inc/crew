import { z } from 'zod';

import { protectedProcedure, router } from '../trpcBackend';
import { attachMethods } from '../../modules/attachMethods';

export const attachRouter = router({
    deleteAttach: protectedProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
        const result = await attachMethods.deleteAttach(input, ctx.session.user);
        return result;
    }),
});
