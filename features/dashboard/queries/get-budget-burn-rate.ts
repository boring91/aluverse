import { dailyBudgetAllocation } from "@/data/budget";
import { db } from "@/db";
import { getCurrentTime } from "@/lib/utils";

export async function getBudgetBurnRate(from?: Date, to?: Date) {
  // Set from and to to current month if not provided
  const now = getCurrentTime();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  from = from ?? currentMonth;
  to = to ?? nextMonth;

  const query = db
    .selectFrom("consolidations")
    .innerJoin("transactions", "transactions.id", "transactionId")
    .where((eb) =>
      eb.and([
        eb("transactions.date", ">=", from),
        eb("transactions.date", "<", to),
        eb("consolidationGroup", "=", "budget"),
      ])
    );

  const total = (
    await query
      .select((eb) =>
        eb.fn
          .coalesce(eb.fn.sum<number>("consolidations.amount"), eb.lit(0))
          .as("total")
      )
      .executeTakeFirstOrThrow()
  ).total;

  const periodDays = Math.ceil(
    (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)
  );

  const dailyBudget = Object.values(dailyBudgetAllocation).reduce(
    (sum, val) => sum + val,
    0
  );

  // Calculate days elapsed in the period
  const endDate = now < to ? now : to;
  const daysElapsed = Math.max(
    0,
    Math.ceil((endDate.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Calculate metrics
  const spent = total;
  const budget = dailyBudget * periodDays;
  const dailyBurnRate = daysElapsed > 0 ? spent / daysElapsed : 0;
  const daysRemaining = Math.max(0, periodDays - daysElapsed);
  const projectedSpent = dailyBurnRate * periodDays;

  return {
    spent,
    budget,
    dailyBurnRate,
    daysRemaining,
    projectedSpent,
  };
}
