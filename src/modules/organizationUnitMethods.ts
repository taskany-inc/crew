import { prisma } from '../utils/prisma';

import { GetOrganizationUnitList } from './organizationUnitSchemas';

const getSeachTypeQuery = (data: GetOrganizationUnitList) => {
    if (data.searchType === 'external') {
        return [{ external: true }];
    }
    if (data.searchType === 'internal') {
        return [{ external: false }];
    }
    return [];
};

export const organizationUnitMethods = {
    getList: (data: GetOrganizationUnitList) => {
        return prisma.organizationUnit.findMany({
            where: {
                OR: [
                    { name: { contains: data.search, mode: 'insensitive' } },
                    { country: { contains: data.search, mode: 'insensitive' } },
                ],
                AND: {
                    OR: getSeachTypeQuery(data),
                },
            },
            take: data.take,
            skip: data.skip,
        });
    },
};
