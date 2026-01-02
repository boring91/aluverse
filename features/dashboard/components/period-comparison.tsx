"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/client-utils";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  data: {
    revenue: { current: number; previous: number; change: number };
    cost: { current: number; previous: number; change: number };
    operatingProfit: { current: number; previous: number; change: number };
    netProfit: { current: number; previous: number; change: number };
  };
};

export const PeriodComparison = ({ data }: Props) => {
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
