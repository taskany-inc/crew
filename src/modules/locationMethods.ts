import { db } from '../utils/db';

export const locationMethods = {
    getList: () => {
        return db.selectFrom('Location').selectAll().execute();
    },

    findOrCreate: async (location: string) => {
        const existingLocation = await db
            .selectFrom('Location')
            .where('name', 'ilike', location)
            .selectAll()
            .executeTakeFirst();
        if (existingLocation) return existingLocation;
        return db.insertInto('Location').values({ name: location }).returningAll().executeTakeFirstOrThrow();
    },
};
