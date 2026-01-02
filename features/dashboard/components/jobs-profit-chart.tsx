"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

type JobsProfitChartProps = {
  data: { name: string; profit: number }[];
};

const chartConfig = {
  profit: {
    label: "Profit %",
    theme: {
      light: "oklch(0.646 0.222 41.116)",
      dark: "oklch(0.488 0.243 264.376)",
    },
  },
} as const;

export const JobsProfitChart = ({ data }: JobsProfitChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Jobs profit%</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              domain={[-150, 100]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={60}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (active && payload?.[0]) {
                  const profit = payload[0].value as number;
                  return (
                    <ChartTooltipContent>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: payload[0].color,
                          }}
                        />
                        <span className="text-muted-foreground">Profit:</span>
                        <span className="font-mono font-medium">
                          {profit.toFixed(2)}%
                        </span>
                      </div>
                    </ChartTooltipContent>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="profit"
              fill="var(--color-profit)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
