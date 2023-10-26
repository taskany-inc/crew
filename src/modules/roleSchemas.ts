import { z } from 'zod';

import { tr } from './modules.i18n';

export const createRoleSchema = z.object({
    name: z.string(),
});
export type CreateRole = z.infer<typeof createRoleSchema>;

export const addRoleToMembershipSchema = z.object({
    membershipId: z.string(),
    roleId: z.string(),
});
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
