import { db } from "@/db";
import { DashboardDateRange } from "../schemas/dashboard.schema";

export async function getExpensesStats(input: DashboardDateRange) {
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
    .where("transactions.type", "=", "expense");

  if (from) {
    expensesQuery = expensesQuery.where("transactions.date", ">=", from);
  }
  if (to) {
    expensesQuery = expensesQuery.where("transactions.date", "<=", to);
  }

  // Group by consolidationGroup and sum amounts
  const expensesByGroup = await expensesQuery
    .select([
      "consolidations.consolidationGroup",
      (eb) => eb.fn.sum<number>("consolidations.amount").as("total"),
    ])
    .groupBy("consolidations.consolidationGroup")
    .execute();

  return expensesByGroup.map((item) => ({
    consolidationGroup: item.consolidationGroup,
    total: item.total ?? 0,
  }));
}
