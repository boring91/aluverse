import { DB } from "@/db/types";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const expensesStatsMapper = (
  eb: ExpressionBuilder<DB, "consolidations" | "transactions">
) =>
  [
    "consolidations.consolidationGroup",
    eb.fn.sum<number>("consolidations.amount").as("total"),
  ] satisfies SelectExpression<DB, "consolidations" | "transactions">[];
