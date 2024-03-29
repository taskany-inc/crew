import { z } from 'zod';

import { tr } from './modules.i18n';

export const getOrganizationUnitListSchema = z.object({
    search: z.string().optional(),
    take: z
        .number()
        .max(100, { message: tr('Max {max} items in a single request', { max: 100 }) })
        .optional(),
    skip: z.number().optional(),
});
export type GetOrganizationUnitList = z.infer<typeof getOrganizationUnitListSchema>;
