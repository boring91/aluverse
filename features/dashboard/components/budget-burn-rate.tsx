"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/client-utils";
import { AlertTriangleIcon, CheckCircleIcon } from "lucide-react";
import { DashboardDateRange } from "../schemas/dashboard.shared-schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { DashboardSection } from "./dashboard-section";
import { formatCurrency, formatPercent } from "@/lib/utils";
type Props = {
  dateRange: DashboardDateRange;
};

export const BudgetBurnRate = ({ dateRange }: Props) => {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.dashboard.budgetBurnRate.queryOptions(dateRange)
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
            <CardTitle className="flex items-center justify-between">
              Budget burn rate
              {data.projectedSpent > data.spent ? (
                <AlertTriangleIcon className="h-5 w-5 text-destructive" />
              ) : (
                <CheckCircleIcon className="h-5 w-5 text-primary" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Spent</span>
                <span className="font-medium">
                  {formatCurrency(data.spent)} / {formatCurrency(data.budget)}
                </span>
              </div>
              <Progress
                value={(data.spent / data.budget) * 100}
                className="h-2"
              />
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>{formatPercent(data.spent / data.budget)}% used</span>
                <span>
                  {formatCurrency(data.budget - data.spent)} remaining
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Daily burn rate
                </div>
                <div className="text-lg font-semibold">
                  {formatCurrency(data.dailyBurnRate)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Days remaining
                </div>
                <div className="text-lg font-semibold">
                  {data.daysRemaining}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-xs text-muted-foreground mb-1">
                Projected total spend
              </div>
              <div
                className={cn(
                  "text-lg font-semibold",
                  data.projectedSpent > data.budget && "text-destructive"
                )}
              >
                {formatCurrency(data.projectedSpent)}
              </div>
              {data.projectedSpent > data.budget && (
                <div className="text-xs text-destructive mt-1">
                  {`Projected to exceed budget by ${formatCurrency(data.projectedSpent - data.budget)}`}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardSection>
  );
};
