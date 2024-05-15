import { Group, User } from 'prisma/prisma-client';

import { prisma } from '../utils/prisma';

export const searchMethods = {
    globalUsers: async (input: string, translit = ''): Promise<User[]> => {
        return prisma.user.findMany({
            take: 5,
            orderBy: {
                _relevance: {
                    fields: ['name', 'email', 'login'],
                    // https://github.com/prisma/prisma/issues/8939#issuecomment-933990947
                    search: input.replace(/[\s\n\t]/g, '_'),
                    sort: 'asc',
                },
            },
            where: {
                OR: [
                    {
                        name: {
                            contains: translit,
                            mode: 'insensitive',
                        },
                    },
                    {
                        name: {
                            contains: input,
                            mode: 'insensitive',
                        },
                    },
                    {
                        email: {
                            contains: input,
                            mode: 'insensitive',
                        },
                    },
                    {
                        login: {
                            contains: translit,
                            mode: 'insensitive',
                        },
                    },
                    {
                        login: {
                            contains: input,
                            mode: 'insensitive',
                        },
                    },
                ],
            },
        });
    },

    global: async (input: string, translit = ''): Promise<{ users: User[]; groups: Group[] }> => {
        const [users, groups] = await Promise.all([
            searchMethods.globalUsers(input, translit),
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
