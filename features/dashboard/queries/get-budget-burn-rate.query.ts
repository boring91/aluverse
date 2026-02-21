import { db } from "@/db";
import { getBudgetAllocatedAmountByDateRangeQuery } from "@/features/budget/queries/get-effective-budget-category-allocations.query";
import { getCurrentTime } from "@/lib/utils";

export async function getBudgetBurnRateQuery(from?: Date, to?: Date) {
  // Set from and to to current month if not provided
  const now = getCurrentTime();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  from = from ?? currentMonth;
  to = to ?? nextMonth;

  const query = db
    .selectFrom("reconciliations")
    .innerJoin("transactions", "transactions.id", "transactionId")
    .where((eb) =>
      eb.and([
        eb("transactions.date", ">=", from),
        eb("transactions.date", "<", to),
        eb("reconciliationGroup", "=", "budget"),
      ])
    );

  const total = await query
    .select((eb) => [
      eb.fn
        .coalesce(eb.fn.sum<number>("reconciliations.amount"), eb.lit(0))
        .as("total"),
    ])
    .executeTakeFirstOrThrow()
    .then((x) => x.total);

  // Calculate days elapsed in the period
  const endDate = now < to ? now : to;
  const daysElapsed = Math.max(
    0,
    Math.ceil((endDate.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Calculate metrics
  const spent = -total;
  const [budgetRange, elapsedBudgetRange] = await Promise.all([
    getBudgetAllocatedAmountByDateRangeQuery(from, to),
    getBudgetAllocatedAmountByDateRangeQuery(from, endDate),
  ]);

  const budget = budgetRange.totalAllocated;
  const elapsedBudget = elapsedBudgetRange.totalAllocated;
  const dailyBurnRate = daysElapsed > 0 ? spent / daysElapsed : 0;
  const daysRemaining = Math.max(
    0,
    Math.ceil((to.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))
  );
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
