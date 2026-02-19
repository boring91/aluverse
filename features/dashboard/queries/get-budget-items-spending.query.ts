import { dailyBudgetAllocation } from "@/data/budget";
import { db } from "@/db";
import { getCurrentTime } from "@/lib/utils";
import { budgetItemsSpendingMapper } from "@/shared/mappers/dashboard/budget-items-spending.mapper";

export async function getBudgetItemsSpendingQuery(from?: Date, to?: Date) {
  const now = getCurrentTime();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  from = from ?? currentMonth;
  to = to ?? nextMonth;

  const data = await db
    .selectFrom("consolidations")
    .innerJoin("transactions", "transactions.id", "transactionId")
    .where((eb) =>
      eb.and([
        eb("consolidationGroup", "=", "budget"),
        eb("transactions.date", ">=", from),
        eb("transactions.date", "<", to),
      ])
    )
    .groupBy("budgetCategory")
    .select(budgetItemsSpendingMapper)
    .execute();

  const period = Math.ceil(
    (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)
  );

  return data.map((item) => {
    const allocated = dailyBudgetAllocation[item.budgetCategory!] * period;
    const remaining = allocated - Math.abs(item.spent);
    const remainingPercent = remaining / allocated;

    return {
      category: item.budgetCategory!,
      spent: item.spent,
      allocated,
      remaining,
      remainingPercent,
    };
  });
}
