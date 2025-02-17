import { Prisma } from 'prisma/prisma-client';

import { prisma } from '../utils/prisma';
import { db } from '../utils/db';

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

    getAll: () => db.selectFrom('OrganizationUnit').selectAll('OrganizationUnit').execute(),

    membershipCountByOrgIds: (ids: string[]) => {
        return db
            .selectFrom('User')
            .innerJoin('Membership', (join) =>
                join.onRef('Membership.userId', '=', 'User.id').on('Membership.archived', 'is not', true),
            )
            .select(({ fn, cast }) => [
                'User.organizationUnitId as id',
                cast(fn.count('User.id').distinct(), 'integer').as('count'),
            ])
            .where('User.organizationUnitId', 'in', ids)
            .groupBy('User.organizationUnitId')
            .$castTo<{ id: string; count: number }>()
            .execute();
    },
};
