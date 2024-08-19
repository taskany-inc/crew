import { trpc } from '../trpc/trpcClient';
import { notifyPromise } from '../utils/notifications/notifyPromise';

import { UpdateMembershipPercentage } from './percentageSchemas';

export const usePercentageMutations = () => {
    const utils = trpc.useContext();
    const updatePercentage = trpc.percentage.update.useMutation({
        onSuccess: () => {
            utils.user.invalidate();
            utils.group.getMemberships.invalidate();
        },
    });

    return {
        updatePercentage: (data: UpdateMembershipPercentage) =>
            notifyPromise(updatePercentage.mutateAsync(data), 'percentageUpdate'),
    };
};
