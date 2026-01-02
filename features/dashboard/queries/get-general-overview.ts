import { db } from "@/db";
import { DashboardDateRange } from "../schemas/dashboard.schema";

export async function getGeneralOverview(input: DashboardDateRange) {
  const { from, to } = input;

  // Base query for transactions
  let transactionsQuery = db.selectFrom("transactions");

  // Apply date filters if provided
  if (from) {
    transactionsQuery = transactionsQuery.where("date", ">=", from);
  }
  if (to) {
    transactionsQuery = transactionsQuery.where("date", "<=", to);
  }

  // Calculate Revenue (sum of income transactions)
  const revenueResult = await transactionsQuery
    .where("type", "=", "income")
    .select((eb) => eb.fn.sum<number>("amount").as("total"))
    .executeTakeFirst();

  // Calculate Cost (sum of expense transactions)
  const costResult = await transactionsQuery
    .where("type", "=", "expense")
    .select((eb) => eb.fn.sum<number>("amount").as("total"))
    .executeTakeFirst();

  // Calculate Taxes/Tax Refund (sum of consolidations with tax group)
  let taxesQuery = db
    .selectFrom("consolidations")
    .innerJoin(
      "transactions",
      "transactions.id",
      "consolidations.transactionId"
    )
    .where("consolidations.consolidationGroup", "=", "tax");

  if (from) {
    taxesQuery = taxesQuery.where("transactions.date", ">=", from);
  }
  if (to) {
    taxesQuery = taxesQuery.where("transactions.date", "<=", to);
  }

  const taxesResult = await taxesQuery
    .select((eb) => eb.fn.sum<number>("consolidations.amount").as("total"))
    .executeTakeFirst();

  const revenue = revenueResult?.total ?? 0;
  const costRaw = costResult?.total ?? 0;
  const taxesRefund = taxesResult?.total ?? 0;

  // Cost should be negative for display
  const cost = -Math.abs(costRaw);

  // Calculate derived metrics
  // Operating Profit = Revenue - Cost (where cost is positive raw value)
  const operatingProfit = revenue - costRaw;
  const netProfit = operatingProfit - taxesRefund;

  return {
    revenue,
    cost,
    operatingProfit,
    taxesRefund,
    netProfit,
  };
}
