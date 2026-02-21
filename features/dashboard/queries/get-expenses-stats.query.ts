import { db } from "@/db";
import { DashboardDateRange } from "../schemas/dashboard.shared-schema";

export async function getExpensesStatsQuery(input: DashboardDateRange) {
  const { from, to } = input;

  // Get expenses by reconciliation group
  // Expenses are reconciliations with reconciliationGroup that represents expenses
  let expensesQuery = db
    .selectFrom("reconciliations")
    .innerJoin(
      "transactions",
      "transactions.id",
      "reconciliations.transactionId"
    )
    .where((eb) => eb("reconciliations.amount", "<", eb.lit(0)));

  if (from) {
    expensesQuery = expensesQuery.where("transactions.date", ">=", from);
  }
  if (to) {
    expensesQuery = expensesQuery.where("transactions.date", "<", to);
  }

  // Group by reconciliationGroup and sum amounts
  const expensesByGroup = await expensesQuery
    .select((eb) => [
      "reconciliations.reconciliationGroup",
      eb.fn.sum<number>("reconciliations.amount").as("total"),
    ])
    .groupBy("reconciliations.reconciliationGroup")
    .execute();

  return expensesByGroup.map((item) => ({
    reconciliationGroup: item.reconciliationGroup,
    total: Math.abs(item.total ?? 0),
  }));
}
