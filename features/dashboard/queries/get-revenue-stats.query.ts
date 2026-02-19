import { db } from "@/db";
import { consolidationRevenue } from "@/shared/expressions/consolidations/consolidation.expression";
import {
  getMonth,
  getYear,
} from "@/shared/expressions/generic/date.expression";
import { getCurrentTime } from "@/lib/utils";
import {
  revenueStatsTotalMapper,
  revenueTrendMapper,
} from "@/shared/mappers/dashboard/revenue-stats.mapper";
import { DashboardDateRange } from "../schemas/dashboard.shared-schema";

export async function getRevenueStatsQuery(dateRange: DashboardDateRange) {
  const now = getCurrentTime();

  const oneYearAgo = new Date(now.setMonth(now.getMonth() - 12));

  const startOfMonth = new Date(now.setDate(1));

  const { from, to } = dateRange;

  const currentPeriod = {
    from: from && to ? from : startOfMonth,
    to: from && to ? to : now,
  };

  const duration = currentPeriod.to.getDate() - currentPeriod.from.getDate();

  const previousPeriod = {
    from: new Date(currentPeriod.from.getDate() - duration),
    to: currentPeriod.from,
  };

  const currentMonthRevenue = (
    await db
      .selectFrom("consolidations")
      .innerJoin(
        "transactions",
        "transactions.id",
        "consolidations.transactionId"
      )
      .where((eb) =>
        eb.and([
          eb("transactions.date", ">=", currentPeriod.from),
          eb("transactions.date", "<", currentPeriod.to),
        ])
      )
      .where(consolidationRevenue)
      .select(revenueStatsTotalMapper)
      .executeTakeFirstOrThrow()
  ).total;

  const previousMonthRevenue = (
    await db
      .selectFrom("consolidations")
      .innerJoin(
        "transactions",
        "transactions.id",
        "consolidations.transactionId"
      )
      .where((eb) =>
        eb.and([
          eb("transactions.date", ">=", previousPeriod.from),
          eb("transactions.date", "<", previousPeriod.to),
        ])
      )
      .where(consolidationRevenue)
      .select(revenueStatsTotalMapper)
      .executeTakeFirstOrThrow()
  ).total;

  const revenueTrend = await db
    .selectFrom("consolidations")
    .innerJoin(
      "transactions",
      "transactions.id",
      "consolidations.transactionId"
    )
    .where("date", ">=", oneYearAgo)
    .where(consolidationRevenue)
    .groupBy((eb) => [getYear(eb.ref("date")), getMonth(eb.ref("date"))])
    .select(revenueTrendMapper)
    .orderBy((eb) => getYear(eb.ref("date")), "asc")
    .orderBy((eb) => getMonth(eb.ref("date")), "asc")
    .execute();

  return {
    monthOnMonth:
      previousMonthRevenue === 0
        ? 0
        : (currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue,
    revenueTrends: revenueTrend,
  };
}
