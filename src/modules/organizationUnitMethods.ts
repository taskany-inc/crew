import { Prisma } from 'prisma/prisma-client';

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
    getList: async (data: GetOrganizationUnitList) => {
        const where: Prisma.OrganizationUnitWhereInput = {
            OR: [
                { name: { contains: data.search, mode: 'insensitive' } },
                { country: { contains: data.search, mode: 'insensitive' } },
            ],
            AND: {
                OR: getSeachTypeQuery(data),
            },
        };

        if (data.include) {
            where.id = { notIn: data.include };
        }
        const organizations = await prisma.organizationUnit.findMany({
            where,
            take: data.take,
            skip: data.skip,
        });
        if (data.include) {
            const includes = await prisma.organizationUnit.findMany({ where: { id: { in: data.include } } });
            organizations.push(...includes);
        }
        return organizations;
    },
};
