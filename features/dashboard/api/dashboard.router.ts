import { createTRPCRouter, permissionProcedure } from "@/trpc/init";
import { dashboardDateRangeSchema } from "../schemas/dashboard.shared-schema";
import { getGeneralStatsQuery } from "../queries/get-general-stats.query";
import { getPeriodComparisonQuery } from "../queries/get-period-comparison.query";
import { getProjectsInOutStatsQuery } from "../queries/get-projects-in-out-stats.query";
import { getExpensesStatsQuery } from "../queries/get-expenses-stats.query";
import { getProjectProfitStatsQuery } from "../queries/get-project-profit-stats.query";
import { getCashFlowQuery } from "../queries/get-cashflow.query";
import { getRevenueStatsQuery } from "../queries/get-revenue-stats.query";
import { getOutstandingProjectsQuery } from "../queries/get-outstanding-projects.query";
import { getProjectsWithAlertsQuery } from "../queries/get-projects-with-alerts.query";
import { getTopAndWorstPerformersQuery } from "../queries/get-top-and-worst-performers.query";
import { getBudgetBurnRateQuery } from "../queries/get-budget-burn-rate.query";
import { getProjectPipelineQuery } from "../queries/get-project-pipeline.query";
import { getEfficiencyMetricsQuery } from "../queries/get-efficiency-metrics.query";
import { getPaymentStatusQuery } from "../queries/get-payment-status.query";
import { getBudgetItemsSpendingQuery } from "../queries/get-budget-items-spending.query";

export const dashboardRouter = createTRPCRouter({
  generalStats: permissionProcedure("dashboard.read")
    .input(dashboardDateRangeSchema)
    .query(async ({ input }) => {
      return await getGeneralStatsQuery(input);
    }),

  periodComparison: permissionProcedure("dashboard.read")
    .input(dashboardDateRangeSchema)
    .query(async ({ input }) => {
      return await getPeriodComparisonQuery(input);
    }),

  projectsChart: permissionProcedure("dashboard.read")
    .input(dashboardDateRangeSchema)
    .query(async ({ input }) => {
      return await getProjectsInOutStatsQuery(input);
    }),

  expensesStats: permissionProcedure("dashboard.read")
    .input(dashboardDateRangeSchema)
    .query(async ({ input }) => {
      return await getExpensesStatsQuery(input);
    }),

  projectProfitStats: permissionProcedure("dashboard.read")
    .input(dashboardDateRangeSchema)
    .query(async ({ input }) => {
      return await getProjectProfitStatsQuery(input);
    }),

  cashFlow: permissionProcedure("dashboard.read").query(async () => {
    return await getCashFlowQuery();
  }),

  revenueStats: permissionProcedure("dashboard.read")
    .input(dashboardDateRangeSchema)
    .query(async ({ input }) => {
      return await getRevenueStatsQuery(input);
    }),

  outstandingProjects: permissionProcedure("dashboard.read").query(async () => {
    return await getOutstandingProjectsQuery();
  }),

  projectsWithAlerts: permissionProcedure("dashboard.read")
    .input(dashboardDateRangeSchema)
    .query(async ({ input }) => {
      return await getProjectsWithAlertsQuery(input.from, input.to);
    }),

  topAndWorstPerformers: permissionProcedure("dashboard.read")
    .input(dashboardDateRangeSchema)
    .query(async ({ input }) => {
      return await getTopAndWorstPerformersQuery(input.from, input.to);
    }),

  budgetBurnRate: permissionProcedure("dashboard.read")
    .input(dashboardDateRangeSchema)
    .query(async ({ input }) => {
      return await getBudgetBurnRateQuery(input.from, input.to);
    }),

  projectPipeline: permissionProcedure("dashboard.read").query(async () => {
    return await getProjectPipelineQuery();
  }),

  efficiencyMetrics: permissionProcedure("dashboard.read")
    .input(dashboardDateRangeSchema)
    .query(async ({ input }) => {
      return await getEfficiencyMetricsQuery(input.from, input.to);
    }),

  paymentStatus: permissionProcedure("dashboard.read")
    .input(dashboardDateRangeSchema)
    .query(async ({ input }) => {
      return await getPaymentStatusQuery(input.from, input.to);
    }),

  budgetItemsSpending: permissionProcedure("dashboard.read")
    .input(dashboardDateRangeSchema)
    .query(async ({ input }) => {
      return await getBudgetItemsSpendingQuery(input.from, input.to);
    }),
});
