import { permissionServiceMethods } from '../../modules/permissionServiceMethods';
import { getPermissionServiceSuggestionsSchema } from '../../modules/permissionServiceSchemas';
import { protectedProcedure, router } from '../trpcBackend';

export const permissionServiceRouter = router({
    suggestions: protectedProcedure.input(getPermissionServiceSuggestionsSchema).query(({ input }) => {
        return permissionServiceMethods.suggestions(input);
    }),
});
