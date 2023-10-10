import { prisma } from '../utils/prisma';

import { getServiceList, createServices } from './service.schemas';

export const userServicesMethods = {
    getList: (data: getServiceList) => {
        return prisma.externalService.findMany({ where: { name: { contains: data.search } }, take: data.take });
    },
    addToUser: (data: createServices) => {
        return prisma.userServices.create({ data });
    },
    getUserServices: (id: string) => {
        return prisma.userServices.findMany({ where: { userId: id }, include: { service: true } });
    },
};
