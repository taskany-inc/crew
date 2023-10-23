import { trpc } from '../trpc/trpcClient';

export const useDeviceMutations = () => {
    const utils = trpc.useContext();

    return {
        addDeviceToUser: trpc.device.addToUser.useMutation({
            onSuccess: () => {
                utils.user.getById.invalidate();
            },
        }),
    };
};
