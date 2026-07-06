import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc";
import { OverviewCard } from "./overview-card";
import { DashboardSection } from "./dashboard-section";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import type { DashboardDateRange } from "../schemas/dashboard.shared-schema";

type Props = {
  dateRange: DashboardDateRange;
};

export const GeneralOverview = ({ dateRange }: Props) => {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.dashboard.generalStats.queryOptions(dateRange),
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
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">General overview</h2>
      <DashboardSection isLoading={isLoading} skeleton={skeleton}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <OverviewCard title="Revenue" value={data?.revenue ?? 0} />
          <OverviewCard title="Cost" value={data?.cost ?? 0} />
          <OverviewCard
            title="Operating profit"
            value={data?.operatingProfit ?? 0}
          />
          <OverviewCard title="Taxes/Tax Refund" value={data?.taxes ?? 0} />
          <OverviewCard title="Net profit" value={data?.netProfit ?? 0} />
        </div>
      </DashboardSection>
    </div>
  );
};
