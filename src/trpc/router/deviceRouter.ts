import { z } from 'zod';

import { deviceMethods } from '../../modules/deviceMethods';
import { createDeviceSchema, deleteUserDeviceSchema, getDeviceListSchema } from '../../modules/deviceSchemas';
import { accessCheck, checkRoleForAccess } from '../../utils/access';
import { protectedProcedure, router } from '../trpcBackend';

export const deviceRouter = router({
    addToUser: protectedProcedure.input(createDeviceSchema).mutation(({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editUser'));
        return deviceMethods.addToUser(input);
    }),

    getList: protectedProcedure.input(getDeviceListSchema).query(({ input }) => {
        return deviceMethods.getList(input);
    }),

    getUserDevices: protectedProcedure.input(z.string()).query(({ input }) => {
        return deviceMethods.getUserDevices(input);
    }),

    deleteUserDevice: protectedProcedure.input(deleteUserDeviceSchema).mutation(({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editUser'));
        return deviceMethods.deleteUserDevice(input);
    }),
});
