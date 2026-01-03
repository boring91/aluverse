"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { DashboardSection } from "./dashboard-section";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardDateRange } from "../schemas/dashboard.schema";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/utils";
import { Pie, Cell, PieChart } from "recharts";

type Props = {
  dateRange: DashboardDateRange;
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
      <ExpensesOverviewChart data={chartData} />
    </DashboardSection>
  );
};

type ExpensesOverviewChartProps = {
  data: { name: string; value: number; percent: number }[];
};

const chartConfig = {
  Contingencies: {
    label: "Contingencies",
    theme: {
      light: "oklch(0.828 0.189 84.429)",
      dark: "oklch(0.627 0.265 303.9)",
    },
  },
  Other: {
    label: "Other",
    theme: {
      light: "oklch(0.769 0.188 70.08)",
      dark: "oklch(0.645 0.246 16.439)",
    },
  },
} as const;

export const ExpensesOverviewChart = ({ data }: ExpensesOverviewChartProps) => {
  // Transform data for the chart
  const chartData = data.map((item) => ({
    name: item.name,
    value: item.value / 100, // Convert cents to dollars
    percent: item.percent,
  }));

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
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
            >
              {chartData.map((entry, index) => {
                const colorKey =
                  entry.name === "Contingencies" ? "Contingencies" : "Other";
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={`var(--color-${colorKey})`}
                  />
                );
              })}
            </Pie>
            <ChartTooltip
              content={({ active, payload }) => {
                if (active && payload?.[0]) {
                  const data = payload[0].payload as {
                    name: string;
                    value: number;
                    percent: number;
                  };
                  return (
                    <ChartTooltipContent>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor: payload[0].color,
                            }}
                          />
                          <span className="text-muted-foreground">
                            {data.name}:
                          </span>
                        </div>
                        <div className="font-mono font-medium">
                          {formatCurrency(data.value * 100)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {data.percent.toFixed(1)}%
                        </div>
                      </div>
                    </ChartTooltipContent>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
