import { z } from "zod";
import { transactionTypes } from "./constants";

// Financial
export const createFinancialAccountSchema = z.object({
    name: z.string().min(1),
});

export const createTransactionSchema = z.object({
    date: z.date(),
    description: z.string().min(1),
    amount: z.number().min(1),
    type: z.enum(transactionTypes),
});

// Projects
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

export const createProjectSupplySchema = z.object({
    name: z.string().min(1),
    quantity: z.number().min(1),
    unitPrice: z.number().min(1),
});

export const createProjectLaborSchema = z.object({
    name: z.string().min(1),
    hours: z.number().min(1),
    rate: z.number().min(1),
});

export const createProjectMiscSchema = z.object({
    name: z.string().min(1),
    amount: z.number().min(1),
});

export const createProjectPaymentSchema = z.object({
    date: z.date(),
    amount: z.number().min(1),
});
