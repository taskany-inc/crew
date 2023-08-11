import { z } from 'zod';

export const getGroupIdSchema = z.object({
    groupId: z.string(),
});

export type getGroupId = z.infer<typeof getGroupIdSchema>;
