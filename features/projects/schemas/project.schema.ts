import { z } from "zod";

export const createProjectSchema = z.object({
    client: z.string().min(1),
    title: z.string().min(1),
    visitDate: z.date().nullable().optional(),
    startDate: z.date().nullable().optional(),
    endDate: z.date().nullable().optional(),
    address: z.string().nullable().optional(),
    meters: z.number().nullable().optional(),
    price: z.number().min(1),
});

export const updateProjectSchema = createProjectSchema.safeExtend({
    id: z.uuid(),
});

