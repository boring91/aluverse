"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "../lib/dummy-data";
import { cn } from "@/lib/client-utils";
import { AlertTriangleIcon } from "lucide-react";
import { useTranslations } from "next-intl";

type ReceivablesCardProps = {
  data: {
    total: number;
    overdue: number;
    overdueCount: number;
    averageDaysOutstanding: number;
    breakdown: {
      project: string;
      client: string;
      amount: number;
      daysOverdue: number;
    }[];
  };
};

export const ReceivablesCard = ({ data }: ReceivablesCardProps) => {
  const t = useTranslations("Dashboard");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {t("outstandingReceivables")}
          {data.overdueCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangleIcon className="h-3 w-3" />
              {data.overdueCount} {t("overdue").toLowerCase()}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {t("totalOutstanding")}
            </span>
            <span className="text-lg font-semibold">
              {formatCurrency(data.total)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {t("overdue")}
            </span>
            <span className="text-lg font-semibold text-destructive">
              {formatCurrency(data.overdue)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {t("avgDaysOutstanding")}
            </span>
            <span className="text-sm font-medium">
              {data.averageDaysOutstanding} days
            </span>
          </div>
        </div>

        {data.breakdown.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <div className="text-sm font-medium mb-2">
              {t("topOutstanding")}
            </div>
            {data.breakdown.map((item) => (
              <div
                key={item.project}
                className="flex justify-between items-center text-sm"
              >
                <div className="flex-1">
                  <div className="font-medium">{item.project}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.client}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={cn(
                      "font-medium",
                      item.daysOverdue > 0 && "text-destructive"
                    )}
                  >
                    {formatCurrency(item.amount)}
                  </div>
                  {item.daysOverdue > 0 && (
                    <div className="text-xs text-destructive">
                      {item.daysOverdue} {t("daysOverdue")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
