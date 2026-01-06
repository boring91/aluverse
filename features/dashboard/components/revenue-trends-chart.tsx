"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardSection } from "./dashboard-section";
import { DashboardDateRange } from "../schemas/dashboard.schema";
import { formatCurrency, stringsToNeutralColors } from "@/lib/utils";

type Props = {
  dateRange: DashboardDateRange;
};

const color = stringsToNeutralColors([""])[0];

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

  return (
    <DashboardSection isLoading={isLoading} skeleton={skeleton}>
      {data && (
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {t("revenueTrends")}
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
              config={{
                revenue: {
                  color,
                },
              }}
              className="aspect-auto! h-[280px] w-full"
            >
              <AreaChart data={data.revenueTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatCurrency(value)}
                  width={90}
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
                              {t(payload.name as "income" | "expense")}:
                            </span>
                            <span className="font-mono font-medium tabular-nums">
                              {`${formatCurrency(payload.value as number)}`}
                            </span>
                          </div>
                        );
                      }}
                    />
                  }
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
