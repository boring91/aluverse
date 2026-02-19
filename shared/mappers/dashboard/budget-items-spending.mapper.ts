import { DB } from "@/db/types";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const budgetItemsSpendingMapper = (
  eb: ExpressionBuilder<DB, "consolidations" | "transactions">
) =>
  [
    "budgetCategory",
    eb.fn.sum<number>("consolidations.amount").as("spent"),
  ] satisfies SelectExpression<DB, "consolidations" | "transactions">[];
