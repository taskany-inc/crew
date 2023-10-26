import { trpc } from '../trpc/trpcClient';

export const useGroupMutations = () => {
    const utils = trpc.useContext();

    return {
        addGroup: trpc.group.add.useMutation({
            onSuccess: () => {
                utils.group.invalidate();
            },
        }),

        editGroup: trpc.group.edit.useMutation({
            onSuccess: () => {
                utils.group.invalidate();
            },
        }),

        archiveGroup: trpc.group.archive.useMutation({
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
