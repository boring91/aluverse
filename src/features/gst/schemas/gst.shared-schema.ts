import { z } from "zod";
import { listSchema } from "@/lib/shared-schemas";
import { calendarDateSchema } from "@/lib/date";

export const pendingGstSchema = z.object({
  from: calendarDateSchema,
  to: calendarDateSchema,
});

export type PendingGstInput = z.infer<typeof pendingGstSchema>;

export const createGstPaymentSchema = z.object({
  periodFrom: calendarDateSchema,
  periodTo: calendarDateSchema,
  rate: z.number().min(0).max(1),
  amount: z.number().max(0),
});

export const updateGstPaymentSchema = createGstPaymentSchema.safeExtend({
  id: z.uuid(),
});

export const gstPaymentFiltersSchema = z.object({
  from: calendarDateSchema.optional(),
  to: calendarDateSchema.optional(),
});

export type GstPaymentFilters = z.infer<typeof gstPaymentFiltersSchema>;

export const listGstPaymentSchema = listSchema.safeExtend({
  filters: gstPaymentFiltersSchema.optional(),
});
