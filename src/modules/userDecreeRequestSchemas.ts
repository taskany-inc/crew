import { z } from 'zod';

import { getPhoneSchema } from './userCreationRequestSchemas';
import { tr } from './modules.i18n';

export const userToDecreeSchema = z.object({
    userId: z.string(),
    surname: z.string({ required_error: tr('Required field') }).min(1, { message: tr('Required field') }),
    firstName: z.string({ required_error: tr('Required field') }).min(1, { message: tr('Required field') }),
    middleName: z.string().optional(),
    workEmail: z
        .string({ required_error: tr('Required field') })
        .min(1, { message: tr('Required field') })
        .min(5, { message: tr('Minimum {min} symbols', { min: 5 }) })
        .email(tr('Not a valid email')),
    personalEmail: z.string().optional(),
    phone: getPhoneSchema(),
    login: z
        .string({ required_error: tr('Required field') })
        .min(1, { message: tr('Required field') })
        .regex(/^[a-z0-9]+$/, { message: tr('Login should contain only lowercase letters and digits') }),
    title: z
        .string({ invalid_type_error: tr('Required field'), required_error: tr('Required field') })
        .min(1, { message: tr('Required field') }),
    firedOrganizationUnitId: z.string().optional(),
    positions: z.array(
        z.object({
            organizationUnitId: z.string().min(1, { message: tr('Required field') }),
            percentage: z.number(),
            unitId: z.string().optional(),
            workEndDate: z.date(),
        }),
    ),
});

export type UserToDecreeSchema = z.infer<typeof userToDecreeSchema>;
