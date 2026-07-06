import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc";
import { DashboardSection } from "./dashboard-section";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardDateRange } from "../schemas/dashboard.shared-schema";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { XAxis, YAxis, Bar, BarChart } from "recharts";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/router";
import { stringsToNeutralColors } from "@/lib/utils";

type Props = {
  dateRange: DashboardDateRange;
};

export const ProjectProfitOverview = ({ dateRange }: Props) => {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.dashboard.projectProfitStats.queryOptions(dateRange),
  );

  const skeleton = (
    <Card>
      <div className="p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    </Card>
  );

  if (!data && !isLoading) {
    return null;
  }

  return (
    <DashboardSection isLoading={isLoading} skeleton={skeleton}>
      <ProjectProfitOverviewChart data={data || []} />
    </DashboardSection>
  );
};

type ProjectProfitOverviewChartProps = {
  data: inferRouterOutputs<AppRouter>["dashboard"]["projectProfitStats"];
};

const fill = stringsToNeutralColors([""])[0];

export const ProjectProfitOverviewChart = ({
  data,
}: ProjectProfitOverviewChartProps) => {
  const chartData = data.map((item) => ({
    name: item.name,
    profit: Math.round(item.profit * 100),
    fill,
  }));

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Projects profit percentage</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer config={{}} className="aspect-auto! h-[280px] w-full">
          <BarChart data={chartData} layout="vertical">
            <XAxis
              type="number"
              domain={[-100, 100]}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
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
                          {`${payload.value}%`}
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <Bar dataKey="profit" fill="var(--color-profit)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
