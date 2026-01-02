"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatCurrency } from "../lib/dummy-data";

type RevenueTrendsChartProps = {
  data: { month: string; revenue: number }[];
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

export const RevenueTrendsChart = ({ data }: RevenueTrendsChartProps) => {
  const chartData = data.map((item) => ({
    month: item.month,
    revenue: item.revenue / 100,
  }));

  // Calculate growth rate
  const growthRate =
    chartData.length >= 2
      ? ((chartData[chartData.length - 1].revenue -
          chartData[chartData.length - 2].revenue) /
          chartData[chartData.length - 2].revenue) *
        100
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Revenue Trends
          <div className="text-sm font-normal">
            <span
              className={growthRate >= 0 ? "text-primary" : "text-destructive"}
            >
              {growthRate >= 0 ? "+" : ""}
              {growthRate.toFixed(1)}%
            </span>
            <span className="text-muted-foreground ml-1">MoM</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart data={chartData}>
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
                        <span className="text-muted-foreground">Revenue:</span>
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
  );
};
