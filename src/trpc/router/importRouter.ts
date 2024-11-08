import { z } from 'zod';

import { importMethods } from '../../modules/importMethods';
import { structureNodeSchema } from '../../modules/importSchemas';
import { accessCheck, checkRoleForAccess } from '../../utils/access';
import { protectedProcedure, router } from '../trpcBackend';

export const importRouter = router({
    uploadStructure: protectedProcedure
        .input(z.object({ structure: structureNodeSchema, rootGroupId: z.string() }))
        .mutation(({ input, ctx }) => {
            accessCheck(checkRoleForAccess(ctx.session.user.role, 'importData'));
            importMethods.uploadStructure(input.structure, input.rootGroupId, ctx.session.user.email);
            return 'ok';
        }),
});
