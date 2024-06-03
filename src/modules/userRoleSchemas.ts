import { z } from 'zod';

import { scopes } from '../utils/access';

export const addScopeToRoleSchema = z.object({
    code: z.string(),
    scope: z.object({
        field: z.string().refine((scope) => scopes.includes(scope as (typeof scopes)[number])),
        value: z.boolean(),
    }),
});

export type AddScopeToRole = z.infer<typeof addScopeToRoleSchema>;

export const getUserRoleWithScopeSchema = z
    .object({
        query: z.string().optional(),
    })
    .optional();

export type GetUserRoleWithScopeData = z.infer<typeof getUserRoleWithScopeSchema>;
