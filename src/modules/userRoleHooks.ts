import { trpc } from '../trpc/trpcClient';
import { notifyPromise } from '../utils/notifications/notifyPromise';

import { ChangeRoleScope } from './userRoleSchemas';

export const useUserRoleMutations = () => {
    const utils = trpc.useContext();

    const changeRoleScope = trpc.userRole.changeRoleScope.useMutation({
        onSuccess: () => {
            utils.userRole.getListWithScope.invalidate();
        },
    });

    return {
        changeRoleScope: (data: ChangeRoleScope) =>
            notifyPromise(changeRoleScope.mutateAsync(data), 'userRoleChangeScope'),
    };
};
