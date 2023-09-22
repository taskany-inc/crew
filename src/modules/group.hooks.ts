import { trpc } from '../trpc/trpcClient';

export const useGroupMutations = () => {
    const utils = trpc.useContext();

    return {
        moveGroup: trpc.group.move.useMutation({
            onSuccess: () => {
                utils.group.invalidate();
            },
        }),
    };
};
