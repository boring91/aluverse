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
