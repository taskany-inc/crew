import { z } from 'zod';

export const getPermissionServiceSuggestionsSchema = z.object({
    query: z.string(),
    take: z.number().optional(),
    include: z.array(z.string()).optional(),
});

export type GetPermissionServiceSuggestions = z.infer<typeof getPermissionServiceSuggestionsSchema>;
