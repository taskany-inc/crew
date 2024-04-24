import { z } from 'zod';

import { tr } from './modules.i18n';

export const createAndGiveAchievementSchema = z.object({
    icon: z.string({ required_error: tr('Icon URL is required') }).min(1, { message: tr('Icon URL is required') }),
    title: z
        .string({ required_error: tr('Title is required') })
        .min(3, { message: tr('Title must be longer than {min} symbol', { min: 3 }) }),
    description: z
        .string({ required_error: tr('Description is required') })
        .min(3, { message: tr('Description must be longer than {min} symbol', { min: 3 }) }),
    userId: z.string(),
    hidden: z.boolean(),
});
export type CreateAndGiveAchievement = z.infer<typeof createAndGiveAchievementSchema>;

export const giveAchievementSchema = z.object({
    userId: z.string(),
    achievementId: z.string(),
    amount: z
        .number()
        .positive({ message: tr('Amount should be greater than zero') })
        .optional(),
});
export type GiveAchievement = z.infer<typeof giveAchievementSchema>;

export const getAchievementListSchema = z.object({
    search: z.string().optional(),
    take: z
        .number()
        .max(100, { message: tr('Max {max} items in a single request', { max: 100 }) })
        .optional(),
});
export type GetAchievementList = z.infer<typeof getAchievementListSchema>;
