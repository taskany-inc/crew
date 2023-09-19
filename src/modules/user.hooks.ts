import { trpc } from '../trpc/trpcClient';

export const useUserMutations = () => {
    const utils = trpc.useContext();

    return {
        addUserToGroup: trpc.user.addToGroup.useMutation({
            onSuccess: () => {
                utils.user.invalidate();
            },
        }),
    };
};
