import { db } from "@/db";
import { DashboardDateRange } from "../schemas/dashboard.shared-schema";
import { expensesStatsMapper } from "@/shared/mappers/dashboard/expenses-stats.mapper";

export async function getExpensesStatsQuery(input: DashboardDateRange) {
  const { from, to } = input;

  // Get expenses by consolidation group
  // Expenses are consolidations with consolidationGroup that represents expenses
  let expensesQuery = db
    .selectFrom("consolidations")
    .innerJoin(
      "transactions",
      "transactions.id",
      "consolidations.transactionId"
    )
    .where((eb) => eb("consolidations.amount", "<", eb.lit(0)));

  if (from) {
    expensesQuery = expensesQuery.where("transactions.date", ">=", from);
  }
  if (to) {
    expensesQuery = expensesQuery.where("transactions.date", "<=", to);
  }

  // Group by consolidationGroup and sum amounts
  const expensesByGroup = await expensesQuery
    .select(expensesStatsMapper)
    .groupBy("consolidations.consolidationGroup")
    .execute();

  return expensesByGroup.map((item) => ({
    consolidationGroup: item.consolidationGroup,
    total: item.total ?? 0,
  }));
}
