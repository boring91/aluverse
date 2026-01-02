"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";
import { formatCurrency } from "@/lib/utils";

type Props = {
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

export const ExpensesChart = ({ data }: Props) => {
  // Transform data for the chart
  const chartData = data.map((item) => ({
    name: item.name,
    value: item.value / 100, // Convert cents to dollars
    percent: item.percent,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
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
