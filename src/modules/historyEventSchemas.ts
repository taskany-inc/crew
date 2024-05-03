import { z } from 'zod';

export const getUserActivitySchema = z.object({
    userId: z.string(),
    cursor: z.string().nullish(),
});
export type GetUserActivity = z.infer<typeof getUserActivitySchema>;
