"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { ExpensesChart } from "./expenses-chart";
import { DashboardSection } from "./dashboard-section";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { DashboardDateRange } from "../schemas/dashboard.schema";

type Props = {
  dateRange: DashboardDateRange;
};

export const ExpensesChartSection = ({ dateRange }: Props) => {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.dashboard.expensesStats.queryOptions(dateRange)
  );

  const skeleton = (
    <Card>
      <div className="p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-64 w-full rounded-full" />
      </div>
    </Card>
  );

  if (!data && !isLoading) {
    return null;
  }

  // Process data for chart: calculate total and percentages
  const totalExpenses = (data || []).reduce((sum, item) => sum + item.total, 0);

  const chartData = (data || []).map((item) => {
    const percent = totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0;
    return {
      name: item.consolidationGroup,
      value: item.total,
      percent,
    };
  });

  return (
    <DashboardSection isLoading={isLoading} skeleton={skeleton}>
      <ExpensesChart data={chartData} />
    </DashboardSection>
  );
};
