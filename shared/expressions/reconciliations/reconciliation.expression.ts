import { ExpressionBuilder } from "kysely";
import { DB } from "@/db/types";

export const reconciliationRevenue = (
  eb: ExpressionBuilder<DB, "reconciliations">
) => revenueOrCost(eb, "income");

export const reconciliationCost = (
  eb: ExpressionBuilder<DB, "reconciliations">
) => revenueOrCost(eb, "expense");

const revenueOrCost = (
  eb: ExpressionBuilder<DB, "reconciliations">,
  type: "income" | "expense"
) =>
  eb.and([
    type === "income"
      ? eb("reconciliations.amount", ">", eb.lit(0))
      : eb("reconciliations.amount", "<", eb.lit(1)),
    eb("reconciliationGroup", "not in", ["loan", "tax", "refund", "refunded"]),
  ]);
