"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { DashboardDateRange } from "../schemas/dashboard.shared-schema";
import { DashboardSection } from "./dashboard-section";
import { formatCurrency, formatPercent } from "@/lib/utils";

type Props = {
  dateRange: DashboardDateRange;
};

export const EfficiencyMetrics = ({ dateRange }: Props) => {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.dashboard.efficiencyMetrics.queryOptions(dateRange)
  );

  const skeleton = (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <DashboardSection isLoading={isLoading} skeleton={skeleton}>
      {data && (
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Efficiency metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Revenue per project
                </div>
                <div className="text-lg font-semibold">
                  {formatCurrency(data.revenuePerProject)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Cost per project
                </div>
                <div className="text-lg font-semibold">
                  {formatCurrency(data.costPerProject)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Avg. project value
                </div>
                <div className="text-lg font-semibold">
                  {formatCurrency(data.valuePerProject)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Completion rate
                </div>
                <div className="text-lg font-semibold">
                  {formatPercent(
                    data.projectCount > 0
                      ? data.completedCount / data.projectCount
                      : 0
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  Projects completed
                </span>
                <span className="font-medium">
                  {data.completedCount} / {data.projectCount}
                </span>
              </div>
              <Progress
                value={(data.completedCount / data.projectCount) * 100}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardSection>
  );
};
