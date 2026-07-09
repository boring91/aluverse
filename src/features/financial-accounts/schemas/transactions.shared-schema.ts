import { z } from "zod";
import { transactionReconciliationGroups } from "@/lib/constants";
import { listSchema, booleanFilterSchema } from "@/lib/shared-schemas";
import { calendarDateSchema } from "@/lib/date";

export const transactionFiltersSchema = z.object({
  keyword: z.string().optional(),
  from: calendarDateSchema.optional(),
  to: calendarDateSchema.optional(),
  fromAmount: z.number().optional(),
  toAmount: z.number().optional(),
  isReconciled: booleanFilterSchema.optional(),
  hasGst: booleanFilterSchema.optional(),
  reconciliationGroup: z.enum(transactionReconciliationGroups).optional(),
  budgetCategoryId: z.uuid().optional(),
  projectId: z.string().optional(),
});

export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;

export const listTransactionSchema = listSchema.safeExtend({
  accountId: z.uuid().optional(),
  filters: transactionFiltersSchema.optional(),
});

export const createTransactionSchema = z.object({
  date: calendarDateSchema,
  description: z.string().min(1),
  amount: z.number(),
});

export const createTransactionWithAccountIdSchema =
  createTransactionSchema.safeExtend({
    accountId: z.uuid(),
  });

export const updateTransactionSchema = createTransactionSchema.safeExtend({
  id: z.uuid(),
});
