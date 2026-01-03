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
import { useTranslations } from "next-intl";
import { XAxis, YAxis, Bar, BarChart } from "recharts";

type Props = {
  dateRange: DashboardDateRange;
};

export const ProjectProfitOverview = ({ dateRange }: Props) => {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.dashboard.projectProfitStats.queryOptions(dateRange)
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

export const ProjectProfitOverviewChart = ({
  data,
}: ProjectProfitOverviewChartProps) => {
  const t = useTranslations("Dashboard");

  const chartData = data.map((item) => ({
    name: item.name,
    profit: Math.round(item.profit * 100),
  }));

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>{t("projectsProfitPercentage")}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto! h-[280px] w-full"
        >
          <BarChart
            data={chartData}
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
