import { trpc } from '../trpc/trpcClient';
import { notifyPromise } from '../utils/notifications/notifyPromise';

import { CreateDevice } from './deviceSchemas';

export const useDeviceMutations = () => {
    const utils = trpc.useContext();

    const addDeviceToUser = trpc.device.addToUser.useMutation({
        onSuccess: () => {
            utils.user.getById.invalidate();
            utils.device.getUserDevices.invalidate();
        },
    });

    return {
        addDeviceToUser: (data: CreateDevice) => notifyPromise(addDeviceToUser.mutateAsync(data), 'deviceAddToUser'),
    };
};
