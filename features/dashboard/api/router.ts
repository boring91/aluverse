import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { dashboardDateRangeSchema } from "../schemas/dashboard.schema";
import { getGeneralOverview } from "../queries/get-general-overview";
import { getPeriodComparison } from "../queries/get-period-comparison";
import { getProjectsInOutStats } from "../queries/get-projects-chart";
import { getExpensesStats } from "../queries/get-expenses-stats";
import { getProjectProfitStats } from "../queries/get-project-profit-stats";
import { getCashFlow } from "../queries/get-cashflow";

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

  projectsChart: protectedProcedure
    .input(dashboardDateRangeSchema)
    .query(async ({ input }) => {
      return await getProjectsInOutStats(input);
    }),

  expensesStats: protectedProcedure
    .input(dashboardDateRangeSchema)
    .query(async ({ input }) => {
      return await getExpensesStats(input);
    }),

  projectProfitStats: protectedProcedure
    .input(dashboardDateRangeSchema)
    .query(async ({ input }) => {
      return await getProjectProfitStats(input);
    }),

  cashFlow: protectedProcedure.query(async () => {
    return await getCashFlow();
  }),
});
