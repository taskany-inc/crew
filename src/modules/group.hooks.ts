import { trpc } from '../trpc/trpcClient';

export const useGroupMutations = () => {
    const utils = trpc.useContext();

    return {
        editGroup: trpc.group.edit.useMutation({
            onSuccess: () => {
                utils.group.invalidate();
            },
        }),

        moveGroup: trpc.group.move.useMutation({
            onSuccess: () => {
                utils.group.invalidate();
            },
        }),
    };
};
