import { trpc } from '../trpc/trpcClient';
import { notifyPromise } from '../utils/notifications/notifyPromise';

export const useAttachMutations = () => {
    const utils = trpc.useContext();

    const deleteAttach = trpc.attach.deleteAttach.useMutation({
        onSuccess: () => {
            utils.scheduledDeactivation.invalidate();
            utils.userCreationRequest.invalidate();
        },
    });

    return {
        deleteAttach: (id: string) => notifyPromise(deleteAttach.mutateAsync(id), 'attachDelete'),
    };
};
