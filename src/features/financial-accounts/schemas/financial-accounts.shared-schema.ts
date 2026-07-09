import { z } from "zod";

export const createFinancialAccountSchema = z.object({
  name: z.string().min(1),
  frolloAccountId: z.string().optional(),
});

export const updateFinancialAccountSchema =
  createFinancialAccountSchema.safeExtend({
    id: z.uuid(),
  });
