"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { DashboardSection } from "./dashboard-section";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardDateRange } from "../schemas/dashboard.schema";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { stringsToNeutralColors } from "@/lib/utils";
import { Pie, PieChart } from "recharts";
import { inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "@/trpc/routers/_app";
import { useMemo } from "react";

type Props = {
  dateRange: DashboardDateRange;
};

const GROUP_LABELS: Record<string, string> = {
  budget: "Budget",
  project: "Project",
  loan: "Loan",
  tax: "Tax",
  refund: "Refund",
  refunded: "Refunded",
  unclassified: "Unclassified",
};

export const ExpensesOverview = ({ dateRange }: Props) => {
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

  return (
    <DashboardSection isLoading={isLoading} skeleton={skeleton}>
      {data && <ExpensesOverviewChart data={data} />}
    </DashboardSection>
  );
};

type ExpensesOverviewChartProps = {
  data: inferRouterOutputs<AppRouter>["dashboard"]["expensesStats"];
};

const chartConfig = {} satisfies ChartConfig;

export const ExpensesOverviewChart = ({ data }: ExpensesOverviewChartProps) => {
  const totalExpenses = (data || []).reduce((sum, item) => sum + item.total, 0);

  const colors = useMemo(() => {
    return stringsToNeutralColors(data.map((x) => x.consolidationGroup));
  }, [data]);

  const chartData = (data || []).map((item, index) => {
    const percent = totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0;
    return {
      name: item.consolidationGroup,
      value: item.total,
      percent,
      fill: colors[index],
    };
  });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Expenses</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto! h-[280px] w-full"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={chartData}
              dataKey="percent"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={(value) => {
                const name = GROUP_LABELS[value.name as string] ?? value.name;
                return `${name} ${(value.percent as number).toFixed(2)}%`;
              }}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
