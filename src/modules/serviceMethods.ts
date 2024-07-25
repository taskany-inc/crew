import { TRPCError } from '@trpc/server';

import { prisma } from '../utils/prisma';

import { GetServiceList, CreateService, DeleteUserService } from './serviceSchemas';
import { UserServiceInfo } from './serviceTypes';
import { tr } from './modules.i18n';

export const serviceMethods = {
    getList: (data: GetServiceList) => {
        return prisma.externalService.findMany({
            where: {
                OR: [
                    { name: { contains: data.search, mode: 'insensitive' } },
                    { displayName: { contains: data.search, mode: 'insensitive' } },
                ],
            },
            take: data.take,
            skip: data.skip,
        });
    },

    addToUser: async (data: CreateService) => {
        const userService = await prisma.userService.findUnique({
            where: { serviceName_serviceId: { serviceName: data.serviceName, serviceId: data.serviceId } },
            include: { user: true },
        });
        if (userService) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: tr('Service with this id already belongs to user {user}', {
                    user: userService.user.name || userService.user.email,
                }),
            });
        }
        return prisma.userService.create({ data });
    },

    getUserServices: (id: string): Promise<UserServiceInfo[]> => {
        return prisma.userService.findMany({ where: { userId: id }, include: { service: true } });
    },

    deleteUserService: (data: DeleteUserService) => {
        return prisma.userService.delete({
            where: {
                userId: data.userId,
                serviceName_serviceId: { serviceName: data.serviceName, serviceId: data.serviceId },
            },
        });
    },
};
