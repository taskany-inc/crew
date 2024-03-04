import { z } from 'zod';

import { deviceMethods } from '../../modules/deviceMethods';
import { createDeviceSchema, deleteUserDeviceSchema, getDeviceListSchema } from '../../modules/deviceSchemas';
import { userAccess } from '../../modules/userAccess';
import { accessCheck } from '../../utils/access';
import { protectedProcedure, router } from '../trpcBackend';
import { deviceAccess } from '../../modules/deviceAccess';

export const deviceRouter = router({
    addToUser: protectedProcedure.input(createDeviceSchema).mutation(({ input, ctx }) => {
        accessCheck(userAccess.isEditable(ctx.session.user, input.userId));
        return deviceMethods.addToUser(input);
    }),
    getList: protectedProcedure.input(getDeviceListSchema).query(({ input }) => {
        return deviceMethods.getList(input);
    }),
    getUserDevices: protectedProcedure.input(z.string()).query(({ input }) => {
        return deviceMethods.getUserDevices(input);
    }),
    deleteUserDevice: protectedProcedure.input(deleteUserDeviceSchema).mutation(({ input, ctx }) => {
        accessCheck(deviceAccess.delete(ctx.session.user));
        return deviceMethods.deleteUserDevice(input);
    }),
});
