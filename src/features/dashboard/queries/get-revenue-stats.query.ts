import { db } from "@/db";
import { reconciliationRevenue } from "@/shared/expressions/reconciliations/reconciliation.expression";
import {
  getMonth,
  getYear,
} from "@/shared/expressions/generic/date.expression";
import { parseUtcDate, shiftDateString, toDateString } from "@/lib/date";
import { getCurrentTime } from "@/lib/utils";
import type { DashboardDateRange } from "../schemas/dashboard.shared-schema";

export async function getRevenueStatsQuery(dateRange: DashboardDateRange) {
  const now = getCurrentTime();

  // Derive these from `now`'s components — never via setMonth/setDate, which
  // mutate `now` in place and corrupt the values read afterwards.
  const oneYearAgo = new Date(
    now.getFullYear() - 1,
    now.getMonth(),
    now.getDate(),
  );

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const { from, to } = dateRange;

  const currentPeriod = {
    from: from && to ? from : toDateString(startOfMonth),
    // Half-open upper bound: the first EXCLUDED day. Default to tomorrow so
    // today's revenue is included (the query uses `date < to`).
    to: from && to ? to : shiftDateString(toDateString(now), 1),
  };

  // Previous period: the equal-length window immediately before the current
  // one (half-open, so the current `from` is its exclusive end).
  const durationDays = Math.round(
    (parseUtcDate(currentPeriod.to).getTime() -
      parseUtcDate(currentPeriod.from).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  const previousPeriod = {
    from: shiftDateString(currentPeriod.from, -durationDays),
    to: currentPeriod.from,
  };

  const currentMonthRevenue = (
    await db
      .selectFrom("reconciliations")
      .innerJoin(
        "transactions",
        "transactions.id",
        "reconciliations.transactionId",
      )
      .where((eb) =>
        eb.and([
          eb("transactions.date", ">=", currentPeriod.from),
          eb("transactions.date", "<", currentPeriod.to),
        ]),
      )
      .where(reconciliationRevenue)
      .select((eb) => [
        eb.fn
          .coalesce(eb.fn.sum<number>("reconciliations.amount"), eb.lit(0))
          .as("total"),
      ])
      .executeTakeFirstOrThrow()
  ).total;

  const previousMonthRevenue = (
    await db
      .selectFrom("reconciliations")
      .innerJoin(
        "transactions",
        "transactions.id",
        "reconciliations.transactionId",
      )
      .where((eb) =>
        eb.and([
          eb("transactions.date", ">=", previousPeriod.from),
          eb("transactions.date", "<", previousPeriod.to),
        ]),
      )
      .where(reconciliationRevenue)
      .select((eb) => [
        eb.fn
          .coalesce(eb.fn.sum<number>("reconciliations.amount"), eb.lit(0))
          .as("total"),
      ])
      .executeTakeFirstOrThrow()
  ).total;

  const revenueTrend = await db
    .selectFrom("reconciliations")
    .innerJoin(
      "transactions",
      "transactions.id",
      "reconciliations.transactionId",
    )
    .where("date", ">=", toDateString(oneYearAgo))
    .where(reconciliationRevenue)
    .groupBy((eb) => [getYear(eb.ref("date")), getMonth(eb.ref("date"))])
    .select((eb) => [
      eb.fn
        .coalesce(eb.fn.sum<number>("reconciliations.amount"), eb.lit(0))
        .as("revenue"),
      getMonth(eb.ref("date")).as("month"),
      getYear(eb.ref("date")).as("year"),
    ])
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
