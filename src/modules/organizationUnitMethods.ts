import { prisma } from '../utils/prisma';

import { GetOrganizationUnitList } from './organizationUnitSchemas';

export const organizationUnitMethods = {
    getList: (data: GetOrganizationUnitList) => {
        return prisma.organizationUnit.findMany({
            where: {
                OR: [
                    { name: { contains: data.search, mode: 'insensitive' } },
                    { country: { contains: data.search, mode: 'insensitive' } },
                ],
            },
            take: data.take,
            skip: data.skip,
        });
    },
};
