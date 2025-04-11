import { TRPCError } from '@trpc/server';
import { UserService } from 'prisma/prisma-client';

import { prisma } from '../utils/prisma';
import { db } from '../utils/db';
import { ExternalServiceName, findService } from '../utils/externalServices';

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

    editUserService: async (data: CreateService) => {
        const conflictingService = await db
            .selectFrom('UserServices')
            .innerJoin('User', 'User.id', 'UserServices.userId')
            .where('UserServices.serviceName', '=', data.serviceName)
            .where('UserServices.serviceId', '=', data.serviceId)
            .select(['UserServices.userId', 'User.name', 'User.email'])
            .executeTakeFirst();

        if (conflictingService && conflictingService.userId !== data.userId) {
            throw new TRPCError({
                code: 'PRECONDITION_FAILED',
                message: tr('Service with this id already belongs to user {user}', {
                    user: conflictingService.name || conflictingService.email,
                }),
            });
        }

        const existingService = await db
            .selectFrom('UserServices')
            .where('UserServices.userId', '=', data.userId)
            .where('UserServices.serviceName', '=', data.serviceName)
            .select(['UserServices.serviceName', 'UserServices.serviceId'])
            .executeTakeFirst();

        if (existingService) {
            return db
                .updateTable('UserServices')
                .set({ serviceId: data.serviceId })
                .where('UserServices.serviceName', '=', existingService.serviceName)
                .where('UserServices.serviceId', '=', existingService.serviceId)
                .returningAll()
                .executeTakeFirstOrThrow();
        }

        return db.insertInto('UserServices').values(data).returningAll().executeTakeFirstOrThrow();
    },

    updateUserServicesInRequest: async (data: {
        services: UserService[];
        userId: string;
        phone?: string;
        workEmail?: string;
        personalEmail?: string;
    }) => {
        if (!findService(ExternalServiceName.Phone, data.services) && data.phone) {
            await serviceMethods.addToUser({
                userId: data.userId,
                serviceId: data.phone,
                serviceName: ExternalServiceName.Phone,
            });
        }

        if (!findService(ExternalServiceName.WorkEmail, data.services) && data.workEmail) {
            await serviceMethods.addToUser({
                userId: data.userId,
                serviceId: data.workEmail,
                serviceName: ExternalServiceName.WorkEmail,
            });
        }

        if (!findService(ExternalServiceName.PersonalEmail, data.services) && data.personalEmail) {
            await serviceMethods.addToUser({
                userId: data.userId,
                serviceId: data.personalEmail,
                serviceName: ExternalServiceName.PersonalEmail,
            });
        }
    },
};
