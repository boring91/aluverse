import { z } from "zod";
import {
  transactionReconciliationGroups,
  projectStreams,
} from "@/lib/constants";
import { listSchema } from "@/lib/shared-schemas";

export const listReconciliationSchema = listSchema.safeExtend({
  transactionId: z.uuid(),
});

export const createReconciliationSchema = z
  .object({
    amount: z.number(),
    description: z.string().min(1).optional(),
    reconciliationGroup: z.enum(transactionReconciliationGroups),
    budgetCategoryId: z.uuid().optional(),

    /* for projects */
    projectId: z.uuid().optional(),
    projectStream: z.enum(projectStreams).optional(),
    projectItemId: z.uuid().optional(),

    /* for loans */
    loanId: z.uuid().optional(),
    isPayoff: z.boolean().optional(),
    loanPayoffId: z.uuid().optional(),

    isGst: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.reconciliationGroup === "budget") {
      if (!data.budgetCategoryId) {
        ctx.addIssue({
          code: "custom",
          params: {
            code: "CATEGORY_REQUIRED",
          },
          message: "CATEGORY_REQUIRED",
          path: ["budgetCategoryId"],
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

    if (data.reconciliationGroup !== "budget" && data.budgetCategoryId) {
      ctx.addIssue({
        code: "custom",
        params: {
          code: "CANNOT_ASSOCIATE_CATEGORY",
        },
        message: "CANNOT_ASSOCIATE_CATEGORY",
        path: ["budgetCategoryId"],
      });
    }

    if (data.reconciliationGroup === "project") {
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
    }

    if (data.reconciliationGroup === "loan") {
      if (!data.loanId) {
        ctx.addIssue({
          code: "custom",
          params: {
            code: "LOAN_REQUIRED",
          },
          message: "LOAN_REQUIRED",
          path: ["loanId"],
        });
      }

      if (data.isPayoff && !data.loanPayoffId) {
        ctx.addIssue({
          code: "custom",
          params: {
            code: "LOAN_PAYOFF_REQUIRED",
          },
          message: "LOAN_PAYOFF_REQUIRED",
          path: ["loanPayoffId"],
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
  });

export const createReconciliationWithTransactionIdSchema =
  createReconciliationSchema.safeExtend({
    transactionId: z.uuid(),
  });

export const updateReconciliationSchema = createReconciliationSchema.safeExtend(
  {
    id: z.uuid(),
  }
);
