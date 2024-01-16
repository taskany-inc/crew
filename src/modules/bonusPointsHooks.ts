import { trpc } from '../trpc/trpcClient';
import { notifyPromise } from '../utils/notifications/notifyPromise';

import { ChangeBonusPoints } from './bonusPointsSchemas';

export const useBonusPointsMutations = () => {
    const utils = trpc.useContext();

    const changeBonusPoints = trpc.bonusPoints.change.useMutation({
        onSuccess: (newUser) => {
            utils.user.getById.setData(newUser.id, (oldUser) => {
                return oldUser ? { ...oldUser, bonusPoints: newUser.bonusPoints } : undefined;
            });
            utils.user.getById.invalidate();
        },
    });

    return {
        bonusPointsIsLoading: changeBonusPoints.isLoading,

        changeBonusPoints: (data: ChangeBonusPoints) =>
            notifyPromise(changeBonusPoints.mutateAsync(data), 'bonusPointsChange'),
    };
};
