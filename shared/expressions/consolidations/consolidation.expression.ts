import { ExpressionBuilder } from "kysely";
import { DB } from "@/db/types";

export const consolidationRevenue = (
  eb: ExpressionBuilder<DB, "consolidations">
) => revenueOrCost(eb, "income");

export const consolidationCost = (
  eb: ExpressionBuilder<DB, "consolidations">
) => revenueOrCost(eb, "expense");

const revenueOrCost = (
  eb: ExpressionBuilder<DB, "consolidations">,
  type: "income" | "expense"
) =>
  eb.and([
    type === "income"
      ? eb("consolidations.amount", ">", eb.lit(0))
      : eb("consolidations.amount", "<", eb.lit(1)),
    eb("consolidationGroup", "not in", ["loan", "tax", "refund", "refunded"]),
  ]);
