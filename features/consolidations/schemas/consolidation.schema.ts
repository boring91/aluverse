import { z } from "zod";
import {
    transactionConsolidationGroups,
    transactionBudgetCategories,
    projectStreams,
} from "@/lib/constants";
import { listSchema } from "@/shared/lib/schemas/util-schemas";

export const listConsolidationSchema = listSchema.safeExtend({
    transactionId: z.uuid(),
});

export const createConsolidationSchema = z
    .object({
        amount: z.number().min(1),
        description: z.string().min(1).optional(),
        consolidationGroup: z.enum(transactionConsolidationGroups),
        budgetCategory: z.enum(transactionBudgetCategories).optional(),

        /* for projects */
        projectId: z.uuid().optional(),
        projectStream: z.enum(projectStreams).optional(),
        projectItemId: z.uuid().optional(),

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

            if (!data.projectStream) {
                ctx.addIssue({
                    code: "custom",
                    params: {
                        code: "PROJECT_STREAM_REQUIRED",
                    },
                    message: "PROJECT_STREAM_REQUIRED",
                    path: ["projectStream"],
                });
            }

            if (!data.projectItemId) {
                ctx.addIssue({
                    code: "custom",
                    params: {
                        code: "PROJECT_ITEM_REQUIRED",
                    },
                    message: "PROJECT_ITEM_REQUIRED",
                    path: ["projectItemId"],
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

export const createConsolidationWithTransactionIdSchema =
    createConsolidationSchema.safeExtend({
        transactionId: z.uuid(),
    });

export const updateConsolidationSchema = createConsolidationSchema.safeExtend({
    id: z.uuid(),
});
