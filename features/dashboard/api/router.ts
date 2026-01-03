import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { dashboardDateRangeSchema } from "../schemas/dashboard.schema";
import { getGeneralStats } from "../queries/get-general-stats";
import { getPeriodComparison } from "../queries/get-period-comparison";
import { getProjectsInOutStats } from "../queries/get-projects-chart";
import { getExpensesStats } from "../queries/get-expenses-stats";
import { getProjectProfitStats } from "../queries/get-project-profit-stats";
import { getCashFlow } from "../queries/get-cashflow";
import { getRevenueStats } from "../queries/get-revenue-stats";

export const dashboardRouter = createTRPCRouter({
  generalStats: protectedProcedure
    .input(dashboardDateRangeSchema)
    .query(async ({ input }) => {
      return await getGeneralStats(input);
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

  revenueStats: protectedProcedure
    .input(dashboardDateRangeSchema)
    .query(async ({ input }) => {
      return await getRevenueStats(input);
    }),
});
