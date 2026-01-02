import { z } from "zod";
import { transactionTypes } from "@/lib/constants";
import {
  listSchema,
  booleanFilterSchema,
} from "@/shared/lib/schemas/util-schemas";

export const transactionFiltersSchema = z.object({
  keyword: z.string().optional(),
  from: z.date().optional(),
  to: z.date().optional(),
  fromAmount: z.number().optional(),
  toAmount: z.number().optional(),
  isConsolidated: booleanFilterSchema.optional(),
});

export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;

export const listTransactionSchema = listSchema.safeExtend({
  accountId: z.uuid().optional(),
  filters: transactionFiltersSchema.optional(),
});

export const createTransactionSchema = z.object({
  date: z.date(),
  description: z.string().min(1),
  amount: z.number().min(1),
  type: z.enum(transactionTypes),
});

export const createTransactionWithAccountIdSchema =
  createTransactionSchema.safeExtend({
    accountId: z.uuid(),
  });

export const updateTransactionSchema = createTransactionSchema.safeExtend({
  id: z.uuid(),
});
