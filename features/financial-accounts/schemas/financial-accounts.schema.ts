import { z } from "zod";
import { banks } from "../lib/bank-syncer/constants";

export const createFinancialAccountSchema = z.object({
  name: z.string().min(1),
  syncWithBank: z.enum(banks).optional(),
});

export const updateFinancialAccountSchema =
  createFinancialAccountSchema.safeExtend({
    id: z.uuid(),
  });
