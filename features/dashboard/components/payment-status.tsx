"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/client-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { DashboardDateRange } from "../schemas/dashboard.shared-schema";
import { DashboardSection } from "./dashboard-section";
import { formatPercent } from "@/lib/utils";

type Props = {
  dateRange: DashboardDateRange;
};

export const PaymentStatus = ({ dateRange }: Props) => {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.dashboard.paymentStatus.queryOptions({
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
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Payment status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Payment velocity</span>
                <span className="font-medium">
                  {formatPercent(data.velocity)}
                </span>
              </div>
              <Progress value={data.velocity * 100} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Avg. payment days
                </div>
                <div className="text-lg font-semibold">
                  {data.averagePaymentInDays.toFixed(0)} days
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  On-Time rate
                </div>
                <div className="text-lg font-semibold">
                  {formatPercent(data.onTimeRate)}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">On-Time payments</span>
                <span className="font-medium text-primary">
                  {data.onTimeCount}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Late payments</span>
                <span className="font-medium text-yellow-600">
                  {data.lateCount}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Overdue payments</span>
                <span
                  className={cn(
                    "font-medium",
                    data.overdueCount > 0 && "text-destructive"
                  )}
                >
                  {data.overdueCount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardSection>
  );
};
