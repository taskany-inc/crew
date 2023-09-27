import { trpc } from '../trpc/trpcClient';

export const useUserMutations = () => {
    const utils = trpc.useContext();

    return {
        addUserToGroup: trpc.user.addToGroup.useMutation({
            onSuccess: () => {
                utils.user.invalidate();
                utils.group.getMemberships.invalidate();
            },
        }),

        removeUserFromGroup: trpc.user.removeFromGroup.useMutation({
            onSuccess: () => {
                utils.user.invalidate();
                utils.group.getMemberships.invalidate();
            },
        }),
    };
};
