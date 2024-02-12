import { z } from 'zod';

import { tr } from './modules.i18n';

export const createVacancySchema = z.object({
    name: z
        .string({
            required_error: tr('Title is required'),
        })
        .min(1, {
            message: tr
                .raw('Title must be longer than {upTo} symbol', {
                    upTo: 1,
                })
                .join(''),
        }),
    hireStream: z.string({
        required_error: tr('Hire stream is required'),
    }),
    groupId: z.string(),
});
export type CreateVacancy = z.infer<typeof createVacancySchema>;

export const getVacancyListSchema = z.object({
    search: z.string().optional(),
    archived: z.boolean().optional(),
    groupId: z.string().optional(),
    hireStream: z.string().optional(),
});
export type GetVacancyList = z.infer<typeof getVacancyListSchema>;

export const editVacancySchema = z.object({
    id: z.string(),
    name: z.string().optional(),
    groupId: z.string().optional(),
    hireStream: z.string().optional(),
});
export type EditVacancy = z.infer<typeof editVacancySchema>;
