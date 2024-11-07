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

export const personSchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    role: z.string().optional(),
});
export type Person = z.infer<typeof personSchema>;

export interface StructureNode {
    nodes: Record<string, StructureNode>;
    teamLead?: Person;
    people: Person[];
}
export const structureNodeSchema: z.ZodType<StructureNode> = z.object({
    nodes: z.record(z.lazy(() => structureNodeSchema)),
    teamLead: personSchema.optional(),
    people: personSchema.array(),
});
