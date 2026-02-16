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
import { XAxis, YAxis, Bar, BarChart } from "recharts";
import { formatCurrency, stringsToNeutralColors } from "@/lib/utils";

type Props = {
  dateRange: DashboardDateRange;
};

export const ProjectsInOutStats = ({ dateRange }: Props) => {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.dashboard.projectsChart.queryOptions(dateRange)
  );

  const skeleton = (
    <Card>
      <div className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    </Card>
  );

  if (!data || isLoading) {
    return null;
  }

  return (
    <DashboardSection isLoading={isLoading} skeleton={skeleton}>
      <ProjectsInOutStatsChart in={data.in} out={data.out} />
    </DashboardSection>
  );
};

type ProjectsInOutStatsChartProps = {
  in: number;
  out: number;
};

const fill = stringsToNeutralColors([""])[0];

export const ProjectsInOutStatsChart = (data: ProjectsInOutStatsChartProps) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Projects (in) Projects (out)</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer config={{}} className="aspect-auto! h-[280px] w-full">
          <BarChart
            data={[
              {
                stream: "In",
                value: data.in,
                fill,
              },
              {
                stream: "Out",
                value: data.out,
                fill,
              },
            ]}
          >
            <XAxis
              dataKey="stream"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={90}
              tickFormatter={(x) => formatCurrency(x)}
            />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dashed"
                  formatter={(_, __, payload) => {
                    return (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-0 border-[1.5px] border-dashed bg-transparent my-0.5"
                          style={{
                            borderColor: payload.color,
                          }}
                        />
                        <span className="text-muted-foreground">
                          {payload.name}:
                        </span>
                        <span className="font-mono font-medium tabular-nums">
                          {formatCurrency(payload.value as unknown as number)}
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />

            <Bar dataKey="value" fill="var(--color-stream)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
