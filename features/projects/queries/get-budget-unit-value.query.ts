import { GST_RATE, BUDGET_UNITS_PER_MONTH } from "@/lib/constants";
import { getEffectiveBudgetCategoryAllocationsByDateQuery } from "@/features/budget/queries/get-effective-budget-category-allocations.query";
import { getCurrentTime } from "@/lib/utils";

export async function getBudgetUnitValueQuery() {
  const allocations =
    await getEffectiveBudgetCategoryAllocationsByDateQuery(getCurrentTime());

  const totalMonthlyBeforeGst = allocations.reduce((sum, category) => {
    const amount = category.includingGst
      ? category.monthlyAmount / (1 + GST_RATE)
      : category.monthlyAmount;
    return sum + amount;
  }, 0);

  return Math.ceil(totalMonthlyBeforeGst / BUDGET_UNITS_PER_MONTH);
}
