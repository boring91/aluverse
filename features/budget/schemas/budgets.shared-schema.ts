import { booleanFilterSchema, listSchema } from "@/lib/shared-schemas";
import { z } from "zod";

const budgetCategorySchema = z.object({
  name: z.string().min(1),
  humanId: z.string().min(1),
  includingGst: z.boolean(),
});

export const budgetCategoryFiltersSchema = z.object({
  keyword: z.string().optional(),
  includingGst: booleanFilterSchema.optional(),
});

export const listBudgetCategorySchema = listSchema.safeExtend({
  filters: budgetCategoryFiltersSchema.optional(),
});

export const createBudgetCategorySchema = budgetCategorySchema;

export const updateBudgetCategorySchema = budgetCategorySchema.safeExtend({
  id: z.uuid(),
});

export const listBudgetCategoryAllocationSchema = listSchema.safeExtend({
  budgetCategoryId: z.uuid(),
});

export const createBudgetCategoryAllocationSchema = z.object({
  amount: z.number().min(1),
  effectiveDate: z.date(),
});

export const createBudgetCategoryAllocationWithBudgetCategoryIdSchema =
  createBudgetCategoryAllocationSchema.safeExtend({
    budgetCategoryId: z.uuid(),
  });

export const updateBudgetCategoryAllocationSchema =
  createBudgetCategoryAllocationSchema.safeExtend({
    id: z.uuid(),
  });
