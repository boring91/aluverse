import { z } from "zod";
import { calendarDateSchema } from "@/lib/date";

export const dashboardDateRangeSchema = z.object({
  from: calendarDateSchema.optional(),
  to: calendarDateSchema.optional(),
});

export type DashboardDateRange = z.infer<typeof dashboardDateRangeSchema>;
