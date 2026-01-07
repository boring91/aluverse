"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { DashboardSection } from "./dashboard-section";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardDateRange } from "../schemas/dashboard.schema";
import { cn } from "@/lib/client-utils";
import { formatPercent, formatCurrency } from "@/lib/utils";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";

type Props = {
  dateRange: DashboardDateRange;
};

export const PeriodComparisonSection = ({ dateRange }: Props) => {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.dashboard.periodComparison.queryOptions(dateRange)
  );

  const skeleton = (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  );

  if (!data && !isLoading) {
    return null;
  }

  return (
    <DashboardSection isLoading={isLoading} skeleton={skeleton}>
      <PeriodComparisonChart data={data!} />
    </DashboardSection>
  );
};

type PeriodComparisonChartProps = {
  data: inferRouterOutputs<AppRouter>["dashboard"]["periodComparison"];
};

const PeriodComparisonChart = ({ data }: PeriodComparisonChartProps) => {
  const t = useTranslations("Dashboard");

  const metrics = [
    { label: t("revenue"), ...data.revenue },
    { label: t("cost"), ...data.cost },
    { label: t("operatingProfit"), ...data.operatingProfit },
    { label: t("netProfit"), ...data.netProfit },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("periodComparison")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map((metric) => {
          const isPositive = metric.change > 0;
          const isNegative = metric.change < 0;
          const isCost = metric.label === "Cost";

          return (
            <div key={metric.label} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {metric.label}
                </span>
                <div className="flex items-center gap-2">
                  {isPositive && !isCost && (
                    <ArrowUpIcon className="h-4 w-4 text-primary" />
                  )}
                  {isNegative && !isCost && (
                    <ArrowDownIcon className="h-4 w-4 text-destructive" />
                  )}
                  {isCost && isPositive && (
                    <ArrowDownIcon className="h-4 w-4 text-primary" />
                  )}
                  {isCost && isNegative && (
                    <ArrowUpIcon className="h-4 w-4 text-destructive" />
                  )}
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isPositive && !isCost && "text-primary",
                      isNegative && !isCost && "text-destructive",
                      isCost && isPositive && "text-primary",
                      isCost && isNegative && "text-destructive"
                    )}
                  >
                    {formatPercent(Math.abs(metric.change))}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-baseline">
                <div>
                  <div className="text-lg font-semibold font-mono">
                    {formatCurrency(metric.current)}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{t("previous")}:</span>{" "}
                    <span className="font-mono">
                      {formatCurrency(metric.previous)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
