"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatCurrency } from "../lib/dummy-data";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardSection } from "./dashboard-section";
import { DashboardDateRange } from "../schemas/dashboard.schema";

type Props = {
  dateRange: DashboardDateRange;
};

const chartConfig = {
  revenue: {
    label: "Revenue",
    theme: {
      light: "oklch(0.646 0.222 41.116)",
      dark: "oklch(0.488 0.243 264.376)",
    },
  },
} as const;

export const RevenueTrendsChart = ({ dateRange }: Props) => {
  const t = useTranslations("Dashboard");
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.dashboard.revenueStats.queryOptions({
      ...dateRange,
    })
  );

  const skeleton = (
    <Card>
      <div className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    </Card>
  );

  console.log({ data });

  return (
    <DashboardSection isLoading={isLoading} skeleton={skeleton}>
      {data && (
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Revenue Trends
              <div className="text-sm font-normal">
                <span
                  className={
                    data.monthOnMonth >= 0 ? "text-primary" : "text-destructive"
                  }
                >
                  {data.monthOnMonth >= 0 ? "+" : ""}
                  {(data.monthOnMonth * 100).toFixed(1)}%
                </span>
                <span className="text-muted-foreground ml-1">{t("mom")}</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className="aspect-auto! h-[280px] w-full"
            >
              <AreaChart data={data.revenueTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => formatCurrency(value * 100)}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload?.[0]) {
                      const value = payload[0].value as number;
                      return (
                        <ChartTooltipContent>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{
                                backgroundColor: payload[0].color,
                              }}
                            />
                            <span className="text-muted-foreground">
                              Revenue:
                            </span>
                            <span className="font-mono font-medium">
                              {formatCurrency(value * 100)}
                            </span>
                          </div>
                        </ChartTooltipContent>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  fill="var(--color-revenue)"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </DashboardSection>
  );
};
