"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { PeriodComparison } from "./period-comparison";
import { DashboardSection } from "./dashboard-section";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DashboardDateRange } from "../schemas/dashboard.schema";

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
      <div className="mb-6">
        <PeriodComparison data={data!} />
      </div>
    </DashboardSection>
  );
};
