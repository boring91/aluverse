import { z } from "zod";
import { listSchema } from "@/lib/shared-schemas";

export const listLoanPayoffSchema = listSchema.safeExtend({
  loanId: z.uuid(),
});

export const createLoanPayoffSchema = z.object({
  amount: z.number().min(1),
  date: z.date(),
  notes: z.string().nullable().optional(),
});

export const createLoanPayoffWithLoanIdSchema =
  createLoanPayoffSchema.safeExtend({ loanId: z.uuid() });

export const updateLoanPayoffSchema = createLoanPayoffSchema.safeExtend({
  id: z.uuid(),
});
