import { z } from 'zod';

import { deviceMethods } from '../../modules/deviceMethods';
import { createDeviceSchema, deleteUserDeviceSchema, getDeviceListSchema } from '../../modules/deviceSchemas';
import { accessCheck, checkRoleForAccess } from '../../utils/access';
import { protectedProcedure, router } from '../trpcBackend';
import { userAccess } from '../../modules/userAccess';
import { historyEventMethods } from '../../modules/historyEventMethods';

export const deviceRouter = router({
    addToUser: protectedProcedure.input(createDeviceSchema).mutation(async ({ input, ctx }) => {
        accessCheck(userAccess.isEditable(ctx.session.user, input.userId));
        const result = await deviceMethods.addToUser(input);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'addDeviceToUser', {
            groupId: undefined,
            userId: result.userId,
            before: undefined,
            after: { id: result.deviceId, name: result.deviceName },
        });
        return result;
    }),

    getList: protectedProcedure.input(getDeviceListSchema).query(({ input }) => {
        return deviceMethods.getList(input);
    }),

    getUserDevices: protectedProcedure.input(z.string()).query(({ input }) => {
        return deviceMethods.getUserDevices(input);
    }),

    deleteUserDevice: protectedProcedure.input(deleteUserDeviceSchema).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editUser'));
        const result = await deviceMethods.deleteUserDevice(input);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'removeDeviceFromUser', {
            groupId: undefined,
            userId: result.userId,
            before: undefined,
            after: { id: result.deviceId, name: result.deviceName },
        });
        return result;
    }),
});
