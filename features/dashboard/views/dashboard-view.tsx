"use client";

import { useTitle } from "@/hooks/use-title";
import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/page-container";
import { DatePickerInput } from "@/components/date-picker-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectsChart } from "../components/projects-chart";
import { ExpensesChart } from "../components/expenses-chart";
import { JobsProfitChart } from "../components/jobs-profit-chart";
import { BudgetTable } from "../components/budget-table";
import { CashFlowChart } from "../components/cash-flow-chart";
import { ReceivablesCard } from "../components/receivables-card";
import { ProjectAlerts } from "../components/project-alerts";
import { TopPerformers } from "../components/top-performers";
import { BudgetBurnRate } from "../components/budget-burn-rate";
import { RevenueTrendsChart } from "../components/revenue-trends-chart";
import { PaymentStatus } from "../components/payment-status";
import { ProjectPipeline } from "../components/project-pipeline";
import { EfficiencyMetrics } from "../components/efficiency-metrics";
import { GeneralOverviewSection } from "../components/general-overview-section";
import { PeriodComparisonSection } from "../components/period-comparison-section";
import {
  dashboardData,
  formatCurrency,
  formatPercent,
} from "../lib/dummy-data";
import { useState } from "react";

export const DashboardView = () => {
  const t = useTranslations("Common");
  const tDashboard = useTranslations("Dashboard");

  useTitle(t("dashboard"));

  const [fromDate, setFromDate] = useState<Date | undefined>(
    dashboardData.dateRange.from
  );
  const [toDate, setToDate] = useState<Date | undefined>(
    dashboardData.dateRange.to
  );

  const dateRange = { from: fromDate, to: toDate };

  return (
    <PageContainer>
      {/* Date Range Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            {t("fromDate")}:
          </label>
          <DatePickerInput
            value={fromDate}
            onChange={setFromDate}
            placeholder="Select from date"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            {t("toDate")}:
          </label>
          <DatePickerInput
            value={toDate}
            onChange={setToDate}
            placeholder="Select to date"
          />
        </div>
      </div>

      {/* General Overview */}
      <GeneralOverviewSection dateRange={dateRange} />

      {/* Period Comparison */}
      <PeriodComparisonSection dateRange={dateRange} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <ProjectsChart data={dashboardData.projectsChartData} />
        <ExpensesChart data={dashboardData.expensesChartData} />
        <JobsProfitChart data={dashboardData.jobsProfitData} />
      </div>

      {/* Cash Flow and Revenue Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <CashFlowChart data={dashboardData.cashFlowData} />
        <RevenueTrendsChart data={dashboardData.revenueTrends} />
      </div>

      {/* Actionable Insights: Receivables and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ReceivablesCard data={dashboardData.receivables} />
        <ProjectAlerts alerts={dashboardData.projectAlerts} />
      </div>

      {/* Top/Bottom Performers */}
      <div className="mb-6">
        <TopPerformers
          top={dashboardData.topPerformers}
          bottom={dashboardData.bottomPerformers}
        />
      </div>

      {/* Budget, Payment, Pipeline, Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        <BudgetBurnRate data={dashboardData.budgetBurnRate} />
        <PaymentStatus data={dashboardData.paymentStatus} />
        <ProjectPipeline data={dashboardData.projectPipeline} />
        <EfficiencyMetrics data={dashboardData.efficiencyMetrics} />
      </div>

      {/* Breakdown, Insights, and Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>{tDashboard("breakdown")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {tDashboard("projectsIn")}
              </span>
              <span className="font-medium">
                {formatCurrency(dashboardData.breakdown.projectsIn)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {tDashboard("projectsOut")}
              </span>
              <span className="font-medium text-destructive">
                {formatCurrency(dashboardData.breakdown.projectsOut)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {tDashboard("projects")}
              </span>
              <span className="font-medium text-primary">
                {formatCurrency(dashboardData.breakdown.projects)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {tDashboard("assets")}
              </span>
              <span className="font-medium">
                {formatCurrency(dashboardData.breakdown.assets)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {tDashboard("contingencies")}
              </span>
              <span className="font-medium text-destructive">
                {formatCurrency(dashboardData.breakdown.contingencies)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {tDashboard("unspecified")}
              </span>
              <span className="font-medium">
                {formatCurrency(dashboardData.breakdown.unspecified)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Other Insights */}
        <Card>
          <CardHeader>
            <CardTitle>{tDashboard("otherInsights")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {tDashboard("tollCost")}
              </span>
              <span className="font-medium text-destructive">
                {formatCurrency(dashboardData.insights.tollCost)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {tDashboard("loansAllTime")}
              </span>
              <span className="font-medium text-destructive">
                {formatCurrency(dashboardData.insights.loansAllTime)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {tDashboard("budget")}
              </span>
              <span className="font-medium text-destructive">
                {formatCurrency(dashboardData.insights.budget)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Project Stats */}
        <Card>
          <CardHeader>
            <CardTitle>{tDashboard("projectsProfitStatistics")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {tDashboard("averageProfit")}
              </span>
              <span className="font-medium">
                {formatPercent(dashboardData.projectStats.averageProfit)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {tDashboard("medianProfit")}
              </span>
              <span className="font-medium">
                {formatPercent(dashboardData.projectStats.medianProfit)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {tDashboard("minProfit")}
              </span>
              <span className="font-medium text-destructive">
                {formatPercent(dashboardData.projectStats.minProfit)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {tDashboard("maxProfit")}
              </span>
              <span className="font-medium text-primary">
                {formatPercent(dashboardData.projectStats.maxProfit)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Spending Table */}
      <div className="mb-6">
        <BudgetTable data={dashboardData.budgetSpending} />
      </div>
    </PageContainer>
  );
};
