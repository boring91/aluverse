"use client";

import { useTitle } from "@/hooks/use-title";
import { PageContainer } from "@/components/page-container";
import { ProjectsInOutStats } from "../components/projects-in-out-stats";
import { ExpensesOverview } from "../components/expenses-overview";
import { ProjectProfitOverview } from "../components/project-profit-overview";
import { BudgetTable } from "../components/budget-table";
import { CashFlowChart } from "../components/cash-flow-chart";
import { OutstandingProjects } from "../components/outstanding-projects";
import { ProjectAlerts } from "../components/project-alerts";
import { TopPerformers } from "../components/top-performers";
import { BudgetBurnRate } from "../components/budget-burn-rate";
import { RevenueTrendsChart } from "../components/revenue-trends-chart";
import { PaymentStatus } from "../components/payment-status";
import { ProjectPipeline } from "../components/project-pipeline";
import { EfficiencyMetrics } from "../components/efficiency-metrics";
import { GeneralOverview } from "../components/general-overview";
import { PeriodComparisonSection } from "../components/period-comparison";
import { useState } from "react";
import { DateRange } from "@/components/date-range";

const startCurrentMonth = new Date();
startCurrentMonth.setDate(1);

const now = new Date();

export const DashboardView = () => {
  useTitle("Dashboard");

  const [fromDate, setFromDate] = useState<Date | undefined>(startCurrentMonth);
  const [toDate, setToDate] = useState<Date | undefined>(now);

  const dateRange = { from: fromDate, to: toDate };

  return (
    <PageContainer>
      <div className="flex items-center justify-end">
        <DateRange
          initialDateFrom={startCurrentMonth}
          initialDateTo={now}
          onUpdate={({ range }) => {
            setFromDate(range.from);
            setToDate(range.to);
          }}
        />
      </div>

      {/* General Overview */}
      <GeneralOverview dateRange={dateRange} />

      {/* Period Comparison */}
      <PeriodComparisonSection dateRange={dateRange} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <ProjectsInOutStats dateRange={dateRange} />
        <ExpensesOverview dateRange={dateRange} />
        <ProjectProfitOverview dateRange={dateRange} />
      </div>

      {/* Cash Flow and Revenue Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashFlowChart />
        <RevenueTrendsChart dateRange={dateRange} />
      </div>

      {/* Actionable Insights: Receivables and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OutstandingProjects />
        <ProjectAlerts dateRange={dateRange} />
      </div>

      {/* Top/Bottom Performers */}
      <TopPerformers dateRange={dateRange} />

      {/* Budget, Payment, Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <BudgetBurnRate dateRange={dateRange} />
        <PaymentStatus dateRange={dateRange} />
        <EfficiencyMetrics dateRange={dateRange} />
      </div>

      {/* Pipe line */}
      <ProjectPipeline />

      {/* Budget Spending Table */}
      <BudgetTable dateRange={dateRange} />
    </PageContainer>
  );
};
