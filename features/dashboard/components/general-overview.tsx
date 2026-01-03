"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { OverviewCard } from "./overview-card";
import { DashboardSection } from "./dashboard-section";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { DashboardDateRange } from "../schemas/dashboard.schema";

type Props = {
  dateRange: DashboardDateRange;
};

export const GeneralOverview = ({ dateRange }: Props) => {
  const tDashboard = useTranslations("Dashboard");
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.dashboard.generalStats.queryOptions(dateRange)
  );

  const skeleton = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="p-6">
          <Skeleton className="h-4 w-24 mb-4" />
          <Skeleton className="h-8 w-32" />
        </Card>
      ))}
    </div>
  );

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-4">
        {tDashboard("generalOverview")}
      </h2>
      <DashboardSection isLoading={isLoading} skeleton={skeleton}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <OverviewCard
            title={tDashboard("revenue")}
            value={data?.revenue ?? 0}
          />
          <OverviewCard title={tDashboard("cost")} value={data?.cost ?? 0} />
          <OverviewCard
            title={tDashboard("operatingProfit")}
            value={data?.operatingProfit ?? 0}
          />
          <OverviewCard
            title={tDashboard("taxesTaxRefund")}
            value={data?.taxes ?? 0}
          />
          <OverviewCard
            title={tDashboard("netProfit")}
            value={data?.netProfit ?? 0}
          />
        </div>
      </DashboardSection>
    </div>
  );
};
