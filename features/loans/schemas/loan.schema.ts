import { z } from "zod";
import { loanTypes } from "@/lib/constants";

export const createLoanSchema = z.object({
    type: z.enum(loanTypes),
    partyName: z.string().min(1),
    amount: z.number().min(1),
    date: z.date(),
    dueDate: z.date().nullable().optional(),
    notes: z.string().nullable().optional(),
});

export const updateLoanSchema = createLoanSchema.safeExtend({
    id: z.uuid(),
});

