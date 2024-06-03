import { prisma } from '../utils/prisma';

import { AddScopeToRole, GetUserRoleWithScopeData } from './userRoleSchemas';

export const userRoleMethods = {
    getListWithScope: (data: GetUserRoleWithScopeData) => {
        return prisma.userRole.findMany({
            orderBy: { name: 'asc' },
            where: {
                name: {
                    contains: data?.query,
                    mode: 'insensitive',
                },
            },
        });
    },

    addScopeToRole: async ({ code, scope }: AddScopeToRole) => {
        return prisma.userRole.update({
            where: { code },
            data: {
                [scope.field]: scope.value,
            },
        });
    },
};
