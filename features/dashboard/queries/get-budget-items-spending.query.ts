import { db } from "@/db";
import { getBudgetAllocatedAmountByDateRangeQuery } from "@/features/budget/queries/get-effective-budget-category-allocations.query";
import { getCurrentTime } from "@/lib/utils";

export async function getBudgetItemsSpendingQuery(from?: Date, to?: Date) {
  const now = getCurrentTime();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  from = from ?? currentMonth;
  to = to ?? nextMonth;

  const [{ categories, allocatedByCategoryId }, spentRows] = await Promise.all([
    getBudgetAllocatedAmountByDateRangeQuery(from, to),
    db
      .selectFrom("consolidations")
      .innerJoin("transactions", "transactions.id", "transactionId")
      .where((eb) =>
        eb.and([
          eb("consolidationGroup", "=", "budget"),
          eb("transactions.date", ">=", from),
          eb("transactions.date", "<", to),
        ])
      )
      .where("budgetCategoryId", "is not", null)
      .groupBy("budgetCategoryId")
      .select((eb) => [
        "budgetCategoryId",
        eb.fn.sum<number>("consolidations.amount").as("spent"),
      ])
      .execute(),
  ]);

  const spentByCategoryId = new Map(
    spentRows.map((item) => [item.budgetCategoryId!, item.spent])
  );

  return categories
    .map((category) => {
      const allocated = allocatedByCategoryId[category.id] ?? 0;
      const spent = spentByCategoryId.get(category.id) ?? 0;
      const remaining = allocated - Math.abs(spent);
      const remainingPercent = allocated > 0 ? remaining / allocated : 0;

      return {
        categoryId: category.id,
        categoryHumanId: category.humanId,
        categoryName: category.name,
        spent,
        allocated,
        remaining,
        remainingPercent,
      };
    })
    .filter((item) => item.allocated > 0 || item.spent !== 0);
}
