import { z } from 'zod';

export const structureParsingConfigSchema = z.object({
    sheet: z.string(),
    fullName: z.number(),
    unitId: z.number().optional(),
    personnelNumber: z.number().optional(),
    role: z.number().optional(),
    percent: z.number().optional(),
    groups: z.array(
        z.object({
            name: z.number(),
            lead: z.number().optional(),
        }),
    ),
});
export type StructureParsingConfig = z.infer<typeof structureParsingConfigSchema>;
