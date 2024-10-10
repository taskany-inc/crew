import { z } from 'zod';

import { tr } from './modules.i18n';

export const addRoleToMembershipSchema = z
    .object({
        membershipId: z.string(),
    })
    .and(
        z.discriminatedUnion('type', [
            z.object({ type: z.literal('existing'), id: z.string() }),
            z.object({
                type: z.literal('new'),
                name: z.string().min(1, {
                    message: tr
                        .raw('Title must be longer than {min} symbol', {
                            min: 1,
                        })
                        .join(''),
                }),
            }),
        ]),
    );

export type AddRoleToMembership = z.infer<typeof addRoleToMembershipSchema>;

export const removeRoleFromMembershipSchema = z.object({
    membershipId: z.string(),
    roleId: z.string(),
});
export type RemoveRoleFromMembership = z.infer<typeof removeRoleFromMembershipSchema>;

export const getRoleListSchema = z.object({
    search: z.string().optional(),
    take: z
        .number()
        .max(100, { message: tr('Max {max} items in a single request', { max: 100 }) })
        .optional(),
});
export type GetRoleList = z.infer<typeof getRoleListSchema>;

export const getRoleSuggestionsSchema = z.object({
    query: z.string(),
    take: z.number().optional(),
    include: z.array(z.string()).optional(),
    includeName: z.array(z.string()).optional(),
});

export type GetRoleSuggestions = z.infer<typeof getRoleSuggestionsSchema>;
