import { z } from "zod";
import { loanTypes } from "@/lib/constants";
import {
    listSchema,
    booleanFilterSchema,
} from "@/shared/lib/schemas/util-schemas";

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

export const loanTypeFilterSchema = z
    .enum([...loanTypes, "all"])
    .optional()
    .transform(val => {
        if (val === "all") return undefined;
        return val;
    });

export const loanFiltersSchema = z.object({
    keyword: z.string().optional(),
    type: loanTypeFilterSchema,
    isPaidOff: booleanFilterSchema.optional(),
    from: z.date().optional(),
    to: z.date().optional(),
});

export type LoanFilters = z.infer<typeof loanFiltersSchema>;

export const listLoanSchema = listSchema.safeExtend({
    filters: loanFiltersSchema.optional(),
});

