import { z } from 'zod';
import { VacancyStatus } from '@prisma/client';

import { tr } from './modules.i18n';

export const createVacancySchema = z.object({
    name: z.string({
        required_error: tr('Name is required'),
    }),
    hireStreamId: z.string({
        required_error: tr('Hire stream is required'),
    }),
    groupId: z.string({
        required_error: tr('Team is required'),
    }),
    hiringManagerId: z.string({
        required_error: tr('Hiring manager is required'),
    }),
    hrId: z.string({
        required_error: tr('HR is required'),
    }),
    grade: z.number().optional(),
    unit: z.number().optional(),
    status: z.nativeEnum(VacancyStatus, {
        required_error: tr('Vacancy status is required'),
    }),
});
export type CreateVacancy = z.infer<typeof createVacancySchema>;

export const getVacancyListSchema = z.object({
    search: z.string().optional(),
    archived: z.boolean().optional(),
    hireStreamIds: z.array(z.string()).optional(),
    searchByTeam: z.string().optional(),
    statuses: z.array(z.nativeEnum(VacancyStatus)).optional(),
    hiringManagerEmails: z.array(z.string()).optional(),
    hrEmails: z.array(z.string()).optional(),
    teamIds: z.array(z.string()).optional(),
    closedAt: z.object({ startDate: z.string().datetime(), endDate: z.string().datetime() }).optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
});
export type GetVacancyList = z.infer<typeof getVacancyListSchema>;

export const editVacancySchema = z.object({
    id: z.string(),
    name: z.string().optional(),
    unit: z.number().optional(),
    grade: z.number().optional(),
    status: z.nativeEnum(VacancyStatus).optional(),
    hrId: z.string().optional(),
    hiringManagerId: z.string().optional(),
});
export type EditVacancy = z.infer<typeof editVacancySchema>;
