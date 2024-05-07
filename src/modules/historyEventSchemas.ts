import { z } from 'zod';

export const getUserActivitySchema = z.object({
    userId: z.string(),
    from: z.date().optional(),
    to: z.date().optional(),
    cursor: z.string().nullish(),
});
export type GetUserActivity = z.infer<typeof getUserActivitySchema>;
