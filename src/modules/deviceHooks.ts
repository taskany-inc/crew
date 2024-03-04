import { trpc } from '../trpc/trpcClient';
import { notifyPromise } from '../utils/notifications/notifyPromise';

import { CreateDevice, DeleteUserDevice } from './deviceSchemas';

export const useDeviceMutations = () => {
    const utils = trpc.useContext();

    const addDeviceToUser = trpc.device.addToUser.useMutation({
        onSuccess: () => {
            utils.user.getById.invalidate();
            utils.device.getUserDevices.invalidate();
        },
    });

    const deleteUserDevice = trpc.device.deleteUserDevice.useMutation({
        onSuccess: () => {
            utils.user.getById.invalidate();
            utils.device.invalidate();
        },
    });

    return {
        addDeviceToUser: (data: CreateDevice) => notifyPromise(addDeviceToUser.mutateAsync(data), 'deviceAddToUser'),
        deleteUserDevice: (data: DeleteUserDevice) => notifyPromise(deleteUserDevice.mutateAsync(data), 'deviceDelete'),
    };
};
