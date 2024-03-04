import { trpc } from '../trpc/trpcClient';
import { notifyPromise } from '../utils/notifications/notifyPromise';

import { CreateService, DeleteUserService } from './serviceSchemas';

export const useServiceMutations = () => {
    const utils = trpc.useContext();

    const addServiceToUser = trpc.service.addToUser.useMutation({
        onSuccess: () => {
            utils.user.getById.invalidate();
            utils.service.getUserServices.invalidate();
        },
    });

    const deleteUserService = trpc.service.deleteUserService.useMutation({
        onSuccess: () => {
            utils.user.getById.invalidate();
            utils.service.invalidate();
        },
    });

    return {
        addServiceToUser: (data: CreateService) =>
            notifyPromise(addServiceToUser.mutateAsync(data), 'serviceAddToUser'),

        deleteUserService: (data: DeleteUserService) =>
            notifyPromise(deleteUserService.mutateAsync(data), 'serviceDelete'),
    };
};
