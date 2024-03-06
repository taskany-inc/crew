import { prisma } from '../utils/prisma';

import { CreateDevice, DeleteUserDevice, GetDeviceList } from './deviceSchemas';
import { UserDeviceInfo } from './deviceTypes';

export const deviceMethods = {
    addToUser: (data: CreateDevice) => {
        return prisma.userDevice.create({ data });
    },

    getList: (data: GetDeviceList) => {
        return prisma.device.findMany({
            where: { name: { contains: data.search, mode: 'insensitive' } },
            take: data.take,
        });
    },

    getUserDevices: (id: string): Promise<UserDeviceInfo[]> => {
        return prisma.userDevice.findMany({ where: { userId: id }, include: { device: true } });
    },

    deleteUserDevice: (data: DeleteUserDevice) => {
        return prisma.userDevice.delete({
            where: {
                userId: data.userId,
                deviceName_deviceId: { deviceName: data.deviceName, deviceId: data.deviceId },
            },
        });
    },
};
