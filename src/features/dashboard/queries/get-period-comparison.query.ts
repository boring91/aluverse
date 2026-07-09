import { parseUtcDate, shiftDateString } from "@/lib/date";
import type { DashboardDateRange } from "../schemas/dashboard.shared-schema";
import { getGeneralStatsQuery } from "./get-general-stats.query";

export async function getPeriodComparisonQuery(input: DashboardDateRange) {
  const { from, to } = input;

  // If no date range provided, return zeros
  if (!from || !to) {
    return {
      revenue: { current: 0, previous: 0, change: 0 },
      cost: { current: 0, previous: 0, change: 0 },
      operatingProfit: { current: 0, previous: 0, change: 0 },
      netProfit: { current: 0, previous: 0, change: 0 },
    };
  }

  // Calculate current period metrics
  const current = await getGeneralStatsQuery({ from, to });

  // Previous period: the equal-length window immediately before the current
  // one. Ranges are half-open, so the current `from` is the previous period's
  // exclusive end, and its start is `from` shifted back by the duration.
  const durationDays = Math.round(
    (parseUtcDate(to).getTime() - parseUtcDate(from).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  // Calculate previous period metrics
  const previous = await getGeneralStatsQuery({
    from: shiftDateString(from, -durationDays),
    to: from,
  });

  // Calculate percentage changes
  const calculateChange = (currentValue: number, previousValue: number) => {
    if (previousValue === 0) {
      return currentValue !== 0 ? 1 : 0;
    }
    return (currentValue - previousValue) / Math.abs(previousValue);
  };

  return {
    revenue: {
      current: current.revenue,
      previous: previous.revenue,
      change: calculateChange(current.revenue, previous.revenue),
    },
    cost: {
      current: current.cost,
      previous: previous.cost,
      change: calculateChange(current.cost, previous.cost),
    },
    operatingProfit: {
      current: current.operatingProfit,
      previous: previous.operatingProfit,
      change: calculateChange(
        current.operatingProfit,
        previous.operatingProfit,
      ),
    },
    netProfit: {
      current: current.netProfit,
      previous: previous.netProfit,
      change: calculateChange(current.netProfit, previous.netProfit),
    },
  };
}
