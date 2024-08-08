import { trpc } from '../trpc/trpcClient';
import { notifyPromise } from '../utils/notifications/notifyPromise';

import { AddSupplementalPositionToUser, RemoveSupplementalPositionFromUser } from './supplementalPositionSchema';

export const useSupplementalPositionMutations = () => {
    const utils = trpc.useContext();

    const addSupplementalPositionToUser = trpc.supplementalPosition.addToUser.useMutation({
        onSuccess: () => {
            utils.user.getById.invalidate();
        },
    });

    const removeSupplementalPositionFromUser = trpc.supplementalPosition.removeFromUser.useMutation({
        onSuccess: () => {
            utils.user.getById.invalidate();
        },
    });

    return {
        addSupplementalPositionToUser: (data: AddSupplementalPositionToUser) =>
            notifyPromise(addSupplementalPositionToUser.mutateAsync(data), 'supplementalPositionAdd'),

        removeSupplementalPositionFromUser: (data: RemoveSupplementalPositionFromUser) =>
            notifyPromise(removeSupplementalPositionFromUser.mutateAsync(data), 'supplementalPositionRemove'),
    };
};
