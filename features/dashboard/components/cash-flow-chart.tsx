"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatCurrency } from "../lib/dummy-data";

type CashFlowChartProps = {
  data: { month: string; income: number; expenses: number }[];
};

const chartConfig = {
  income: {
    label: "Income",
    theme: {
      light: "oklch(0.646 0.222 41.116)",
      dark: "oklch(0.488 0.243 264.376)",
    },
  },
  expenses: {
    label: "Expenses",
    theme: {
      light: "oklch(0.577 0.245 27.325)",
      dark: "oklch(0.704 0.191 22.216)",
    },
  },
} as const;

export const CashFlowChart = ({ data }: CashFlowChartProps) => {
  const chartData = data.map((item) => ({
    month: item.month,
    income: item.income / 100,
    expenses: item.expenses / 100,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart data={chartData}>
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
                if (active && payload?.length) {
                  return (
                    <ChartTooltipContent>
                      <div className="grid gap-1.5">
                        {payload.map((item, index) => {
                          const value = item.value as number;
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <div
                                className="h-2.5 w-2.5 rounded-full"
                                style={{
                                  backgroundColor: item.color,
                                }}
                              />
                              <span className="text-muted-foreground">
                                {item.name}:
                              </span>
                              <span className="font-mono font-medium">
                                {formatCurrency(value * 100)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </ChartTooltipContent>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="income"
              stroke="var(--color-income)"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="var(--color-expenses)"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
