import { prisma } from '../utils/prisma';

import { ChangeRoleScope, GetUserRoleWithScopeData } from './userRoleSchemas';

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

    changeRoleScope: async ({ code, scope }: ChangeRoleScope) => {
        return prisma.userRole.update({
            where: { code },
            data: {
                [scope.field]: scope.value,
            },
        });
    },
};
