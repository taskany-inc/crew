import { z } from 'zod';

export const getUserIdSchema = z.object({
    userId: z.string(),
});

export type getUserId = z.infer<typeof getUserIdSchema>;
