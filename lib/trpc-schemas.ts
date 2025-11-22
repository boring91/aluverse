import { z } from "zod";
import { transactionTypes } from "./constants";

export const createFinancialAccountSchema = z.object({
    name: z.string().min(1),
});

export const createTransactionSchema = z.object({
    date: z.date(),
    description: z.string().min(1),
    amount: z.number().min(1),
    type: z.enum(transactionTypes),
});
