import { z } from 'zod';

import { tr } from './modules.i18n';

export const updateMembershipPercentageSchema = z.object({
    membershipId: z.string(),
    percentage: z
        .number({ invalid_type_error: tr('Percentage must be a number') })
        .int(tr('Percentage must be an integer'))
        .min(0, tr('Minimum value is {min}', { min: 0 }))
        .max(100, tr('Maximum value is {max}', { max: 100 }))
        .or(z.null()),
});
export type UpdateMembershipPercentage = z.infer<typeof updateMembershipPercentageSchema>;
