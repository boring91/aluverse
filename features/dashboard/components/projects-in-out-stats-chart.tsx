"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";

type Props = {
  in: number;
  out: number;
};

const chartConfig = {
  projectsIn: {
    label: "Projects (in)",
    theme: {
      light: "oklch(0.646 0.222 41.116)",
      dark: "oklch(0.488 0.243 264.376)",
    },
  },
  projectsOut: {
    label: "Projects (out)",
    theme: {
      light: "oklch(0.6 0.118 184.704)",
      dark: "oklch(0.696 0.17 162.48)",
    },
  },
} as const;

export const ProjectsInOutStatsChart = (data: Props) => {
  const chartData = [
    {
      name: "Projects",
      "Projects (in)": data.in / 100,
      "Projects (out)": data.out / 100,
    },
  ];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Projects (in) Projects (out)</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto! h-[280px] w-full"
        >
          <BarChart data={chartData}>
            <XAxis
              dataKey="name"
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
            <Bar
              dataKey="Projects (in)"
              fill="var(--color-projectsIn)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="Projects (out)"
              fill="var(--color-projectsOut)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
