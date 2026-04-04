import { z } from "zod";
import { listSchema } from "@/lib/shared-schemas";

export const pendingGstSchema = z.object({
  from: z.date(),
  to: z.date(),
});

export type PendingGstInput = z.infer<typeof pendingGstSchema>;

export const createGstPaymentSchema = z.object({
  periodFrom: z.date(),
  periodTo: z.date(),
  rate: z.number().min(0).max(1),
  amount: z.number().min(0),
});

export const updateGstPaymentSchema = createGstPaymentSchema.safeExtend({
  id: z.uuid(),
});

export const gstPaymentFiltersSchema = z.object({
  from: z.date().optional(),
  to: z.date().optional(),
});

export type GstPaymentFilters = z.infer<typeof gstPaymentFiltersSchema>;

export const listGstPaymentSchema = listSchema.safeExtend({
  filters: gstPaymentFiltersSchema.optional(),
});
