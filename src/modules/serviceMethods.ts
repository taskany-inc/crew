import { prisma } from '../utils/prisma';

import { GetServiceList, CreateService, DeleteUserService } from './serviceSchemas';
import { UserServiceInfo } from './serviceTypes';

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
        });
    },

    addToUser: (data: CreateService) => {
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
