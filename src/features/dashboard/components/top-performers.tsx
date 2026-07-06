import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AppRouter } from "@/trpc/router";
import { useTRPC } from "@/trpc";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { DashboardDateRange } from "../schemas/dashboard.shared-schema";
import { DashboardSection } from "./dashboard-section";

type Props = {
  dateRange: DashboardDateRange;
};

type Project =
  inferRouterOutputs<AppRouter>["dashboard"]["topAndWorstPerformers"]["top"][number];

export const TopPerformers = ({ dateRange }: Props) => {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.dashboard.topAndWorstPerformers.queryOptions(dateRange),
  );

  const skeleton = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <div className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Card>
      <Card>
        <div className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Card>
    </div>
  );

  return (
    <DashboardSection isLoading={isLoading} skeleton={skeleton}>
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformersList
            items={data.top}
            icon={TrendingUpIcon}
            titleKey="topPerformers"
            variant="primary"
          />
          <PerformersList
            items={data.bottom}
            icon={TrendingDownIcon}
            titleKey="bottomPerformers"
            variant="destructive"
          />
        </div>
      )}
    </DashboardSection>
  );
};

type PerformersListProps = {
  items: Project[];
  icon: LucideIcon;
  titleKey: "topPerformers" | "bottomPerformers";
  variant: "primary" | "destructive";
};

const PerformersList = ({
  items,
  icon: Icon,
  titleKey,
  variant,
}: PerformersListProps) => {
  const borderBgClass =
    variant === "primary"
      ? "border-primary/20 bg-primary/5"
      : "border-destructive/20 bg-destructive/5";
  const textColorClass =
    variant === "primary" ? "text-primary" : "text-destructive";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${textColorClass}`} />
          {titleKey === "topPerformers"
            ? "Top performers"
            : "Bottom performers"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            No results
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-start justify-between p-3 rounded-lg border ${borderBgClass}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    params={{ projectId: item.id }}
                    to="/projects/$projectId"
                  >
                    <span className="text-sm font-medium">{item.humanId}</span>
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    #{index + 1}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {item.client}
                </div>
                <div className="text-xs text-muted-foreground">
                  Revenue: {formatCurrency(item.paid)}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-semibold ${textColorClass}`}>
                  {item.effectiveMargin === null
                    ? "-"
                    : formatPercent(item.effectiveMargin)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Profit margin
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
