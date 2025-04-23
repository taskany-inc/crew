import { TRPCError } from '@trpc/server';
import { jsonObjectFrom } from 'kysely/helpers/postgres';

import { db } from '../utils/db';
import { getSearchRegex } from '../utils/regex';
import { defaultTake } from '../utils';

import { CreateDevice, DeleteUserDevice, GetDeviceList } from './deviceSchemas';
import { UserDeviceInfo } from './deviceTypes';
import { tr } from './modules.i18n';

export const deviceMethods = {
    addToUser: async (data: CreateDevice) => {
        const userDevice = await db
            .selectFrom('UserDevice')
            .where('UserDevice.deviceName', '=', data.deviceName)
            .where('UserDevice.deviceId', '=', data.deviceId)
            .where('UserDevice.archived', 'is', false)
            .selectAll('UserDevice')
            .select((eb) => [
                jsonObjectFrom(eb.selectFrom('User').selectAll().whereRef('User.id', '=', 'UserDevice.userId'))
                    .$notNull()
                    .as('user'),
            ])
            .executeTakeFirst();
        if (userDevice) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: tr('Device with this id already belongs to user {user}', {
                    user: userDevice.user.name || userDevice.user.email,
                }),
            });
        }
        return db.insertInto('UserDevice').values(data).returningAll().executeTakeFirstOrThrow();
    },

    getList: (data: GetDeviceList) => {
        let query = db
            .selectFrom('Device')
            .selectAll()
            .limit(data.take || defaultTake);
        if (data.search) {
            const regex = getSearchRegex(data.search);
            query = query.where('name', '~*', regex);
        }
        return query.execute();
    },

    getUserDevices: (id: string): Promise<UserDeviceInfo[]> => {
        return db
            .selectFrom('UserDevice')
            .where('UserDevice.userId', '=', id)
            .where('UserDevice.archived', 'is', false)
            .selectAll('UserDevice')
            .select((eb) => [
                jsonObjectFrom(
                    eb.selectFrom('Device').selectAll().whereRef('Device.name', '=', 'UserDevice.deviceName'),
                )
                    .$notNull()
                    .as('device'),
            ])
            .execute();
    },

    deleteUserDevice: (data: DeleteUserDevice) => {
        return db
            .updateTable('UserDevice')
            .where('UserDevice.userId', '=', data.userId)
            .where('UserDevice.deviceName', '=', data.deviceName)
            .where('UserDevice.deviceId', '=', data.deviceId)
            .set({ archived: true, archivedAt: new Date() })
            .returningAll()
            .executeTakeFirstOrThrow();
    },
};
