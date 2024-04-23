import { BonusAction } from 'prisma/prisma-client';
import { z } from 'zod';

import { tr } from './modules.i18n';

export const changeBonusPointsSchema = z.object({
    userId: z.string(),
    action: z.nativeEnum(BonusAction),
    achievementId: z.string().optional(),
    achievementCategory: z.string().optional(),
    amount: z.number().positive({ message: tr('Amount should be greater than zero') }),
    description: z
        .string({ required_error: tr('Description is required') })
        .min(1, { message: tr('Description must be longer than {min} symbol', { min: 1 }) }),
});
export type ChangeBonusPoints = z.infer<typeof changeBonusPointsSchema>;

export const getAchievementsSchema = z.object({
    search: z.string(),
});
export type GetAchievements = z.infer<typeof getAchievementsSchema>;
