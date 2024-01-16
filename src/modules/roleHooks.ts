import { trpc } from '../trpc/trpcClient';
import { notifyPromise } from '../utils/notifications/notifyPromise';

import { AddRoleToMembership, RemoveRoleFromMembership } from './roleSchemas';

export const useRoleMutations = () => {
    const utils = trpc.useContext();

    const addToMembership = trpc.role.addToMembership.useMutation({
        onSuccess: () => {
            utils.user.invalidate();
            utils.group.invalidate();
        },
    });

    const removeFromMembership = trpc.role.removeFromMembership.useMutation({
        onSuccess: () => {
            utils.user.invalidate();
            utils.group.invalidate();
        },
    });

    return {
        addToMembership: (data: AddRoleToMembership) =>
            notifyPromise(addToMembership.mutateAsync(data), 'roleAddToMembership'),

        removeFromMembership: (data: RemoveRoleFromMembership) =>
            notifyPromise(removeFromMembership.mutateAsync(data), 'roleRemoveFromMembership'),
    };
};
