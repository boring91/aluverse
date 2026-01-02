import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { dashboardDateRangeSchema } from "../schemas/dashboard.schema";
import { getGeneralOverview } from "../queries/get-general-overview";
import { getPeriodComparison } from "../queries/get-period-comparison";

export const dashboardRouter = createTRPCRouter({
  generalOverview: protectedProcedure
    .input(dashboardDateRangeSchema)
    .query(async ({ input }) => {
      return await getGeneralOverview(input);
    }),
  periodComparison: protectedProcedure
    .input(dashboardDateRangeSchema)
    .query(async ({ input }) => {
      return await getPeriodComparison(input);
    }),
});
