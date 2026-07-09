import { db } from "@/db";
import { getBudgetAllocatedAmountByDateRangeQuery } from "@/features/budget/queries/get-effective-budget-category-allocations.query";
import { parseUtcDate, shiftDateString, toDateString } from "@/lib/date";
import { getCurrentTime } from "@/lib/utils";

export async function getBudgetBurnRateQuery(from?: string, to?: string) {
  // Set from and to to current month if not provided
  const now = getCurrentTime();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  from = from ?? toDateString(currentMonth);
  to = to ?? toDateString(nextMonth);

  const query = db
    .selectFrom("reconciliations")
    .innerJoin("transactions", "transactions.id", "transactionId")
    .where((eb) =>
      eb.and([
        eb("transactions.date", ">=", from),
        eb("transactions.date", "<", to),
        eb("reconciliationGroup", "=", "budget"),
      ]),
    );

  const total = await query
    .select((eb) => [
      eb.fn
        .coalesce(eb.fn.sum<number>("reconciliations.amount"), eb.lit(0))
        .as("total"),
    ])
    .executeTakeFirstOrThrow()
    .then((x) => x.total);

  // Calculate days elapsed in the period. Keep "now" on the same calendar-date
  // basis as the (calendar-date) bounds — comparing a raw instant to a UTC
  // midnight bound would make the period end at an offset-dependent time and
  // skew the elapsed/remaining day counts.
  const DAY_MS = 1000 * 60 * 60 * 24;
  const fromDate = parseUtcDate(from);
  const toDate = parseUtcDate(to);
  const nowDate = parseUtcDate(toDateString(now));

  // Clamp to 0 so a reversed range (to < from, reachable via the API since the
  // schema validates from/to independently) can't yield negative day counts.
  const totalDays = Math.max(
    0,
    Math.round((toDate.getTime() - fromDate.getTime()) / DAY_MS),
  );
  // Whole calendar days elapsed, counting today, clamped to the period.
  const daysElapsed = Math.max(
    0,
    Math.min(
      Math.floor((nowDate.getTime() - fromDate.getTime()) / DAY_MS) + 1,
      totalDays,
    ),
  );
  const daysRemaining = totalDays - daysElapsed;
  const endDateString = shiftDateString(from, daysElapsed);

  // Calculate metrics
  const spent = -total;
  const [budgetRange, elapsedBudgetRange] = await Promise.all([
    getBudgetAllocatedAmountByDateRangeQuery(from, to),
    getBudgetAllocatedAmountByDateRangeQuery(from, endDateString),
  ]);

  const budget = budgetRange.totalAllocated;
  const elapsedBudget = elapsedBudgetRange.totalAllocated;
  const dailyBurnRate = daysElapsed > 0 ? spent / daysElapsed : 0;
  const projectedSpent =
    daysElapsed > 0 && elapsedBudget > 0
      ? (spent / elapsedBudget) * budget
      : dailyBurnRate * (daysElapsed + daysRemaining);

  return {
    spent,
    budget,
    dailyBurnRate,
    daysRemaining,
    projectedSpent,
  };
}
