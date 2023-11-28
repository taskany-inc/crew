import { trpc } from '../trpc/trpcClient';

export const useBonusPointsMutations = () => {
    const utils = trpc.useContext();

    return {
        changeBonusPoints: trpc.bonusPoints.change.useMutation({
            onSuccess: (newUser) => {
                utils.user.getById.setData(newUser.id, (oldUser) => {
                    return oldUser ? { ...oldUser, bonusPoints: newUser.bonusPoints } : undefined;
                });
                utils.user.getById.invalidate();
            },
        }),
    };
};
