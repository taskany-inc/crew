import { prisma } from '../utils/prisma';

import { CreateDevice, GetDeviceList } from './device.schemas';

export const deviceMethods = {
    addToUser: (data: CreateDevice) => {
        return prisma.userDevice.create({ data });
    },
    getList: (data: GetDeviceList) => {
        return prisma.device.findMany({ where: { name: { contains: data.search } }, take: data.take });
    },
};
