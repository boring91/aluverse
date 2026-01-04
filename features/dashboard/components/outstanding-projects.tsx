"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/client-utils";
import { AlertTriangleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardSection } from "./dashboard-section";
import { formatCurrency } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

export const OutstandingProjects = () => {
  const t = useTranslations("Dashboard");
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.dashboard.outstandingProjects.queryOptions()
  );

  const skeleton = (
    <Card>
      <div className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    </Card>
  );

  console.log({ data });

  return (
    <DashboardSection isLoading={isLoading} skeleton={skeleton}>
      {data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {t("outstandingReceivables")}
              {data.overdue.count > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangleIcon className="h-3 w-3" />
                  {data.overdue.count} {t("overdue").toLowerCase()}
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
                <span className="text-lg font-semibold font-mono">
                  {formatCurrency(data.outstanding.total)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t("overdue")}
                </span>
                <span className="text-lg font-semibold text-destructive font-mono">
                  {formatCurrency(data.overdue.total)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t("avgDaysOutstanding")}
                </span>
                <span className="text-sm font-medium">
                  {data.overdue.daysOverdueAverage} days
                </span>
              </div>
            </div>

            {data.top.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <div className="text-sm font-medium mb-2">
                  {t("topOutstanding")}
                </div>
                {data.top.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <div className="flex-1">
                      <Link href={`/projects/${item.id}`}>
                        <div className="font-medium">{item.humanId}</div>
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {item.client}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={cn(
                          "font-medium font-mono",
                          item.daysOverdue &&
                            item.daysOverdue > 0 &&
                            "text-destructive"
                        )}
                      >
                        {formatCurrency(item.outstanding)}
                      </div>
                      {item.daysOverdue && item.daysOverdue > 0 && (
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
      )}
    </DashboardSection>
  );
};
