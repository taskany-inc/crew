import { z } from 'zod';

import { accessCheck, checkRoleForAccess } from '../../utils/access';
import { protectedProcedure, router } from '../trpcBackend';
import { serviceMethods } from '../../modules/serviceMethods';
import { createServiceSchema, deleteUserServiceSchema, getServiceListSchema } from '../../modules/serviceSchemas';
import { historyEventMethods } from '../../modules/historyEventMethods';
import { ExternalServiceName } from '../../utils/externalServices';

export const serviceRouter = router({
    getList: protectedProcedure.input(getServiceListSchema).query(({ input }) => {
        return serviceMethods.getList(input);
    }),

    addToUser: protectedProcedure.input(createServiceSchema).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editUser'));
        const result = await serviceMethods.addToUser(input);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'addServiceToUser', {
            groupId: undefined,
            userId: result.userId,
            before: undefined,
            after: { id: result.serviceId, name: result.serviceName },
        });
        return result;
    }),

    getUserServices: protectedProcedure.input(z.string()).query(async ({ input, ctx }) => {
        const services = await serviceMethods.getUserServices(input);
        if (
            !ctx.session.user.role?.viewUserExtendedInfo &&
            ctx.session.user.id !== input &&
            !ctx.session.user.role?.editUser
        ) {
            return services.filter(({ serviceName }) => serviceName !== ExternalServiceName.Phone);
        }

        return services;
    }),

    deleteUserService: protectedProcedure.input(deleteUserServiceSchema).mutation(async ({ input, ctx }) => {
        accessCheck(checkRoleForAccess(ctx.session.user.role, 'editUser'));
        const result = await serviceMethods.deleteUserService(input);
        await historyEventMethods.create({ user: ctx.session.user.id }, 'removeServiceFromUser', {
            groupId: undefined,
            userId: result.userId,
            before: undefined,
            after: { id: result.serviceId, name: result.serviceName },
        });
        return result;
    }),
});
