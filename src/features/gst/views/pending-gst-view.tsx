import { DateRange } from "@/components/date-range";
import { PageContainer } from "@/components/page-container";
import { PageLoader } from "@/components/page-loader";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OverviewCard } from "@/features/dashboard/components/overview-card";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { useTitle } from "@/hooks/use-title";
import { getCurrentTime } from "@/lib/utils";
import {
  shiftDateString,
  toDateString,
  toExclusiveDateString,
} from "@/lib/date";
import { useTRPC } from "@/trpc";
import { useQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { parseAsCalendarDate } from "@/lib/calendar-date-param";

function getBasQuarterRange(date: Date) {
  const month = date.getMonth();
  const year = date.getFullYear();

  const fromMonth = month >= 9 ? 9 : month >= 6 ? 6 : month >= 3 ? 3 : 0;
  const from = new Date(year, fromMonth, 1);
  // Last day of the quarter (inclusive) — day 0 of the month after it.
  const to = new Date(year, fromMonth + 3, 0);

  return { from, to };
}

function getDefaultDateRange() {
  const range = getBasQuarterRange(getCurrentTime());
  return {
    from: toDateString(range.from),
    to: toExclusiveDateString(range.to),
  };
}

const defaultRange = getDefaultDateRange();

export const PendingGstView = () => {
  useTitle("Pending GST");
  const { hasPermission, isPending } = useRbacAccess();

  const canRead = hasPermission("reconciliations.read");

  const [queryDates, setQueryDates] = useQueryStates(
    {
      from: parseAsCalendarDate.withDefault(defaultRange.from),
      to: parseAsCalendarDate.withDefault(defaultRange.to),
    },
    { shallow: false },
  );

  const fromDate = queryDates.from;
  const toDate = queryDates.to;

  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.gst.pendingGst.queryOptions(
      { from: fromDate, to: toDate },
      { enabled: canRead },
    ),
  );

  if (isPending) {
    return (
      <PageContainer>
        <PageLoader />
      </PageContainer>
    );
  }

  if (!canRead) {
    return (
      <PageContainer>
        <p className="text-muted-foreground">
          You do not have access to GST information.
        </p>
      </PageContainer>
    );
  }

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
    <PageContainer>
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">Pending GST</h1>
        <DateRange
          initialDateFrom={fromDate}
          initialDateTo={toDate ? shiftDateString(toDate, -1) : undefined}
          pageNavigation={{
            stepInMonths: 3,
            getRangeForDate: getBasQuarterRange,
            previousAriaLabel: "Select previous BAS quarter",
            nextAriaLabel: "Select next BAS quarter",
          }}
          onUpdate={({ range }) => {
            setQueryDates({
              from: toDateString(range.from),
              to: range.to ? toExclusiveDateString(range.to) : null,
            });
          }}
        />
      </div>

      {isLoading ? (
        skeleton
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <OverviewCard title="GST Collected" value={data?.gstCollected ?? 0} />
          <OverviewCard title="GST Credits" value={data?.gstCredits ?? 0} />
          <OverviewCard title="Net GST" value={data?.netGst ?? 0} />
          <OverviewCard title="GST Remitted" value={data?.gstRemitted ?? 0} />
          <OverviewCard title="Pending GST" value={data?.pendingGst ?? 0} />
        </div>
      )}
    </PageContainer>
  );
};
