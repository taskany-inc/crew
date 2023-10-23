import { deviceMethods } from '../../modules/device.methods';
import { createDeviceSchema, getDeviceListSchema } from '../../modules/device.schemas';
import { userAccess } from '../../modules/user.access';
import { accessCheck } from '../../utils/access';
import { protectedProcedure, router } from '../trpcBackend';

export const deviceRouter = router({
    addToUser: protectedProcedure.input(createDeviceSchema).mutation(({ input, ctx }) => {
        accessCheck(userAccess.isEditable(ctx.session.user, input.userId));
        return deviceMethods.addToUser(input);
    }),
    getList: protectedProcedure.input(getDeviceListSchema).query(({ input }) => {
        return deviceMethods.getList(input);
    }),
});
