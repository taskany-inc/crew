import { trpc } from '../trpc/trpcClient';
import { notifyPromise } from '../utils/notifications/notifyPromise';

import {
    CancelScheduledDeactivation,
    CreateScheduledDeactivation,
    EditScheduledDeactivation,
} from './scheduledDeactivationSchemas';

export const useScheduledDeactivation = () => {
    const utils = trpc.useContext();

    const createScheduledDeactivation = trpc.scheduledDeactivation.create.useMutation({
        onSuccess: () => utils.user.invalidate(),
    });

    const editScheduledDeactivation = trpc.scheduledDeactivation.edit.useMutation({
        onSuccess: () => {
            utils.scheduledDeactivation.invalidate();
            utils.user.invalidate();
        },
    });

    const cancelScheduledDeactivation = trpc.scheduledDeactivation.cancel.useMutation({
        onSuccess: () => {
            utils.scheduledDeactivation.invalidate();
            utils.user.invalidate();
        },
    });

    return {
        createScheduledDeactivation: (data: CreateScheduledDeactivation) =>
            notifyPromise(createScheduledDeactivation.mutateAsync(data), 'scheduledDeactivationCreate'),
        editScheduledDeactivation: (data: EditScheduledDeactivation) =>
            notifyPromise(editScheduledDeactivation.mutateAsync(data), 'scheduledDeactivationEdit'),
        cancelScheduledDeactivation: (data: CancelScheduledDeactivation) =>
            notifyPromise(cancelScheduledDeactivation.mutateAsync(data), 'scheduledDeactivationCancel'),
    };
};
