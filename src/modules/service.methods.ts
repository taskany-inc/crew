import { prisma } from '../utils/prisma';

import { GetServiceList, CreateService } from './service.schemas';
import { UserServiceInfo } from './service.types';

export const serviceMethods = {
    getList: (data: GetServiceList) => {
        return prisma.externalService.findMany({ where: { name: { contains: data.search } }, take: data.take });
    },

    addToUser: (data: CreateService) => {
        return prisma.userService.create({ data });
    },

    getUserServices: (id: string): Promise<UserServiceInfo[]> => {
        return prisma.userService.findMany({ where: { userId: id }, include: { service: true } });
    },
};
