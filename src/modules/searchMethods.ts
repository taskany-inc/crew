import { Group, User } from 'prisma/prisma-client';

import { prisma } from '../utils/prisma';

import { getUserListQuery } from './userMethods';

export const searchMethods = {
    globalUsers: async (input: string): Promise<User[]> => {
        const { query } = await getUserListQuery({ search: input });
        return query.limit(5).selectAll('User').execute();
    },

    global: async (input: string): Promise<{ users: User[]; groups: Group[] }> => {
        const [users, groups] = await Promise.all([
            searchMethods.globalUsers(input),
            prisma.group.findMany({
                take: 5,
                where: {
                    name: {
                        contains: input,
                        mode: 'insensitive',
                    },
                    archived: false,
                },
            }),
        ]);

        return { users, groups };
    },
};
