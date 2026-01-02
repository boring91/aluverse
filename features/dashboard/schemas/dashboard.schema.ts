import { z } from "zod";

export const dashboardDateRangeSchema = z.object({
  from: z.date().optional(),
  to: z.date().optional(),
});

export type DashboardDateRange = z.infer<typeof dashboardDateRangeSchema>;
