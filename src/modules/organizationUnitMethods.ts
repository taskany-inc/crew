import { Prisma } from 'prisma/prisma-client';

import { prisma } from '../utils/prisma';
import { db } from '../utils/db';
import { PositionStatus } from '../generated/kyselyTypes';

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
            .selectFrom('SupplementalPosition')
            .select(({ fn, cast }) => [
                'SupplementalPosition.organizationUnitId as id',
                cast<number>(fn.count('SupplementalPosition.userId').distinct(), 'integer').as('count'),
            ])
            .where('SupplementalPosition.organizationUnitId', 'in', ids)
            .where('SupplementalPosition.main', 'is', true)
            .where('SupplementalPosition.status', '=', PositionStatus.ACTIVE)
            .groupBy('SupplementalPosition.organizationUnitId')
            .execute();
        return db
            .selectFrom('User')
            .innerJoin('SupplementalPosition', (join) =>
                join
                    .onRef('SupplementalPosition.userId', '=', 'User.id')
                    .on('SupplementalPosition.main', 'is', true)
                    .on('SupplementalPosition.status', '=', PositionStatus.ACTIVE),
            )
            .select(({ fn, cast }) => [
                'SupplementalPosition.organizationUnitId as id',
                cast(fn.count('User.id').distinct(), 'integer').as('count'),
            ])
            .where('User.organizationUnitId', 'in', ids)
            .groupBy('SupplementalPosition.organizationUnitId')
            .$castTo<{ id: string; count: number }>()
            .execute();
    },
};
