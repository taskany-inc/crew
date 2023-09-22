import { trpc } from '../trpc/trpcClient';

export const useRoleMutations = () => {
    const utils = trpc.useContext();

    return {
        addToMembership: trpc.role.addToMembership.useMutation({
            onSuccess: () => {
                utils.user.invalidate();
                utils.group.invalidate();
            },
        }),

        removeFromMembership: trpc.role.removeFromMembership.useMutation({
            onSuccess: () => {
                utils.user.invalidate();
                utils.group.invalidate();
            },
        }),
    };
};
