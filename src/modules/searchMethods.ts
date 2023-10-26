import { Group, User } from 'prisma/prisma-client';

import { prisma } from '../utils/prisma';

export const searchMethods = {
    global: async (input: string): Promise<{ users: User[]; groups: Group[] }> => {
        const [users, groups] = await Promise.all([
            prisma.user.findMany({
                take: 5,
                where: {
                    OR: [
                        {
                            email: {
                                contains: input,
                                mode: 'insensitive',
                            },
                        },
                        {
                            name: {
                                contains: input,
                                mode: 'insensitive',
                            },
                        },
                    ],
                },
            }),
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
