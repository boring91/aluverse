import { z } from "zod";

export const createFinancialAccountSchema = z.object({
    name: z.string().min(1),
});

export const updateFinancialAccountSchema = z.object({
    id: z.uuid(),
    name: z.string().min(1),
});

