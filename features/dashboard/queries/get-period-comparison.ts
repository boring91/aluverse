import { DashboardDateRange } from "../schemas/dashboard.schema";
import { getGeneralStats } from "./get-general-stats";

export async function getPeriodComparison(input: DashboardDateRange) {
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
  const current = await getGeneralStats({ from, to });

  // Calculate previous period dates
  // Get the duration of the current period
  const periodDurationMs = to.getTime() - from.getTime();
  const periodDurationDays = Math.ceil(
    periodDurationMs / (1000 * 60 * 60 * 24)
  );

  // Calculate previous period: shift back by the period duration
  const previousTo = new Date(from);
  previousTo.setDate(previousTo.getDate() - 1); // Day before current period starts
  const previousFrom = new Date(previousTo);
  previousFrom.setDate(previousFrom.getDate() - periodDurationDays + 1);

  // Calculate previous period metrics
  const previous = await getGeneralStats({
    from: previousFrom,
    to: previousTo,
  });

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) {
      return current !== 0 ? 100 : 0;
    }
    return ((current - previous) / Math.abs(previous)) * 100;
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
        previous.operatingProfit
      ),
    },
    netProfit: {
      current: current.netProfit,
      previous: previous.netProfit,
      change: calculateChange(current.netProfit, previous.netProfit),
    },
  };
}
