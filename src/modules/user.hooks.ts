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

        changeBonusPoints: trpc.user.changeBonusPoints.useMutation({
            onSuccess: (newUser) => {
                utils.user.getById.setData(newUser.id, (oldUser) => {
                    return oldUser ? { ...oldUser, bonusPoints: newUser.bonusPoints } : undefined;
                });
                utils.user.getById.invalidate();
            },
        }),
    };
};
