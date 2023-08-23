import { z } from 'zod';

export const getGroupGhildrenIdSchema = z.object({
    id: z.string(),
});

export type getGroupChildrenId = z.infer<typeof getGroupGhildrenIdSchema>;
