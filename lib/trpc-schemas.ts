import { z } from "zod";
import {
    transactionBudgetCategories,
    transactionConsolidationGroups,
    transactionTypes,
} from "./constants";

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

export const consolidationSchema = z
    .object({
        consolidationGroup: z.enum(transactionConsolidationGroups),
        budgetCategory: z.enum(transactionBudgetCategories).optional(),
        projectId: z.uuid().optional(),
        isGst: z.boolean(),
    })
    .superRefine((data, ctx) => {
        if (data.consolidationGroup === "budget") {
            if (!data.budgetCategory) {
                ctx.addIssue({
                    code: "custom",
                    params: {
                        code: "CATEGORY_REQUIRED",
                    },
                    message: "CATEGORY_REQUIRED",
                    path: ["budgetCategory"],
                });
            }

            if (data.projectId) {
                ctx.addIssue({
                    code: "custom",
                    params: {
                        code: "CANNOT_ASSOCIATE_PROJECT",
                    },
                    message: "CANNOT_ASSOCIATE_PROJECT",
                    path: ["projectId"],
                });
            }
        }

        if (data.consolidationGroup === "project") {
            if (!data.projectId) {
                ctx.addIssue({
                    code: "custom",
                    params: {
                        code: "PROJECT_REQUIRED",
                    },
                    message: "PROJECT_REQUIRED",
                    path: ["projectId"],
                });
            }

            if (data.budgetCategory) {
                ctx.addIssue({
                    code: "custom",
                    params: {
                        code: "CANNOT_ASSOCIATE_CATEGORY",
                    },
                    message: "CANNOT_ASSOCIATE_CATEGORY",
                    path: ["budgetCategory"],
                });
            }
        }
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
