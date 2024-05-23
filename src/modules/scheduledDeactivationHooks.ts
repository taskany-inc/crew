import { trpc } from '../trpc/trpcClient';
import { notifyPromise } from '../utils/notifications/notifyPromise';

import { CreateScheduledDeactivation } from './scheduledDeactivationSchemas';

export const useScheduledDeactivation = () => {
    const createScheduledDeactivation = trpc.scheduledDeactivation.create.useMutation();

    return {
        createScheduledDeactivation: (data: CreateScheduledDeactivation) =>
            notifyPromise(createScheduledDeactivation.mutateAsync(data), 'scheduledDeactivationCreate'),
    };
};
