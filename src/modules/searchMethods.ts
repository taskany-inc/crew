import { Group, User } from 'prisma/prisma-client';
import СyrillicToTranslit from 'cyrillic-to-translit-js';

import { prisma } from '../utils/prisma';

const translit = СyrillicToTranslit();

export const searchMethods = {
    globalUsers: async (input: string): Promise<User[]> => {
        const translitEn = translit.transform(input);
        const translitRu = translit.reverse(input);

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
                            contains: translitEn,
                            mode: 'insensitive',
                        },
                    },
                    {
                        name: {
                            contains: translitRu,
                            mode: 'insensitive',
                        },
                    },
                    {
                        email: {
                            contains: translitEn,
                            mode: 'insensitive',
                        },
                    },
                    {
                        login: {
                            contains: translitEn,
                            mode: 'insensitive',
                        },
                    },
                    {
                        login: {
                            contains: translitEn,
                            mode: 'insensitive',
                        },
                    },

                    {
                        services: {
                            some: {
                                serviceId: { contains: input.replace(/[\s\n\t]/g, '_'), mode: 'insensitive' },
                            },
                        },
                    },
                ],
            },
        });
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
