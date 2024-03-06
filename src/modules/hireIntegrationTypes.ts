import { z } from 'zod';

export interface HireStream {
    name: string;
    id: number;
}

export interface HireUser {
    id: number;
    name: string | null;
    email: string;
}

export const getHireStreamRecruitersSchema = z.object({
    id: z.number(),
    search: z.string().optional(),
    take: z.number().optional(),
});
export type GetHireStreamRecruiters = z.infer<typeof getHireStreamRecruitersSchema>;
