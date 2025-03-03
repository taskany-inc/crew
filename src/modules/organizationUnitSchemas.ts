import { z } from 'zod';
import { OrganizationUnit } from '@prisma/client';

import { tr } from './modules.i18n';

export const organizationUnitSearchTypes = ['external', 'internal'] as const;
export type OrganizationUnitSearchType = (typeof organizationUnitSearchTypes)[number];

export const getOrganizationUnitListSchema = z.object({
    search: z.string().optional(),
    searchType: z.enum(organizationUnitSearchTypes).optional(),
    include: z.array(z.string()).optional(),
    take: z
        .number()
        .max(100, { message: tr('Max {max} items in a single request', { max: 100 }) })
        .optional(),
    skip: z.number().optional(),
});
export type GetOrganizationUnitList = z.infer<typeof getOrganizationUnitListSchema>;

export interface AddSupplementalPositionType {
    percentage: number;
    unitId?: string | null;
    organizationUnit: OrganizationUnit;
    intern?: boolean;
}
