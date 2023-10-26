import { trpc } from '../trpc/trpcClient';

export const useServiceMutations = () => {
    const utils = trpc.useContext();

    return {
        addServiceToUser: trpc.service.addToUser.useMutation({
            onSuccess: () => {
                utils.user.getById.invalidate();
                utils.service.getUserServices.invalidate();
            },
        }),
    };
};
