import { z } from 'zod';

export const getUserActivitySchema = z.object({
    userId: z.string(),
    from: z.date().optional(),
    to: z.date().optional(),
    cursor: z.string().nullish(),
});
export type GetUserActivity = z.infer<typeof getUserActivitySchema>;

export const getAllLogsSchema = z.object({
    from: z.date().optional(),
    to: z.date().optional(),
    cursor: z.string().nullish(),
});
export type GetAllLogs = z.infer<typeof getAllLogsSchema>;
