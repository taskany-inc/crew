import { trpc } from '../trpc/trpcClient';
import { notifyPromise } from '../utils/notifications/notifyPromise';

import { AddScopeToRole } from './userRoleSchemas';

export const useUserRoleMutations = () => {
    const utils = trpc.useContext();

    const addScopeToRole = trpc.userRole.addScopeToRole.useMutation({
        onSuccess: () => {
            utils.userRole.getListWithScope.invalidate();
        },
    });

    return {
        addScopeToRole: (data: AddScopeToRole) => notifyPromise(addScopeToRole.mutateAsync(data), 'addScopeToRole'),
    };
};
