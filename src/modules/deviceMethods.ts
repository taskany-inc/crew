import { TRPCError } from '@trpc/server';

import { prisma } from '../utils/prisma';

import { CreateDevice, DeleteUserDevice, GetDeviceList } from './deviceSchemas';
import { UserDeviceInfo } from './deviceTypes';
import { tr } from './modules.i18n';

export const deviceMethods = {
    addToUser: async (data: CreateDevice) => {
        const userDevice = await prisma.userDevice.findUnique({
            where: {
                deviceName_deviceId: { deviceName: data.deviceName, deviceId: data.deviceId },
            },
            include: { user: true },
        });
        if (userDevice) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: tr('Device with this id already belongs to user {user}', {
                    user: userDevice.user.name || userDevice.user.email,
                }),
            });
        }
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
