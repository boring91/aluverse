import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { dashboardDateRangeSchema } from "../schemas/dashboard.schema";
import { getGeneralStats } from "../queries/get-general-stats";
import { getPeriodComparison } from "../queries/get-period-comparison";
import { getProjectsInOutStats } from "../queries/get-projects-in-out-stats";
import { getExpensesStats } from "../queries/get-expenses-stats";
import { getProjectProfitStats } from "../queries/get-project-profit-stats";
import { getCashFlow } from "../queries/get-cashflow";
import { getRevenueStats } from "../queries/get-revenue-stats";
import { getOutstandingProjects } from "../queries/get-outstanding-projects";
import { getProjectsWithAlerts } from "../queries/get-projects-with-alerts";
import { getTopAndWorstPerformers } from "../queries/get-top-and-worst-performers";
import { getBudgetBurnRate } from "../queries/get-budget-burn-rate";
import { getProjectPipeline } from "../queries/get-project-pipeline";
import { getEfficiencyMetrics } from "../queries/get-efficiency-metrics";
import { getPaymentStatus } from "../queries/get-payment-status";

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

  outstandingProjects: protectedProcedure.query(async () => {
    return await getOutstandingProjects();
  }),

  projectsWithAlerts: protectedProcedure
    .input(dashboardDateRangeSchema)
    .query(async ({ input }) => {
      return await getProjectsWithAlerts(input.from, input.to);
    }),

  topAndWorstPerformers: protectedProcedure
    .input(dashboardDateRangeSchema)
    .query(async ({ input }) => {
      return await getTopAndWorstPerformers(input.from, input.to);
    }),

  budgetBurnRate: protectedProcedure
    .input(dashboardDateRangeSchema)
    .query(async ({ input }) => {
      return await getBudgetBurnRate(input.from, input.to);
    }),

  projectPipeline: protectedProcedure.query(async () => {
    return await getProjectPipeline();
  }),

  efficiencyMetrics: protectedProcedure
    .input(dashboardDateRangeSchema)
    .query(async ({ input }) => {
      return await getEfficiencyMetrics(input.from, input.to);
    }),

  paymentStatus: protectedProcedure
    .input(dashboardDateRangeSchema)
    .query(async ({ input }) => {
      return await getPaymentStatus(input.from, input.to);
    }),
});
