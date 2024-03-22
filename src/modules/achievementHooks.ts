import { trpc } from '../trpc/trpcClient';
import { notifyPromise } from '../utils/notifications/notifyPromise';

import { CreateAndGiveAchievement, GiveAchievement } from './achievementSchemas';

export const useAchievmentMutations = () => {
    const utils = trpc.useContext();

    const createAndGiveAchievement = trpc.achievement.createAndGive.useMutation({
        onSuccess: () => {
            utils.user.getById.invalidate();
            utils.achievement.getList.invalidate();
        },
    });

    const giveAchievement = trpc.achievement.give.useMutation({
        onSuccess: () => {
            utils.user.getById.invalidate();
        },
    });

    return {
        createAndGiveAchievement: (data: CreateAndGiveAchievement) =>
            notifyPromise(createAndGiveAchievement.mutateAsync(data), 'achievementGive'),
        giveAchievement: (data: GiveAchievement) => notifyPromise(giveAchievement.mutateAsync(data), 'achievementGive'),
    };
};
