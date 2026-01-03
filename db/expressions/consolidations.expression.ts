import { ExpressionBuilder } from "kysely";
import { DB } from "../types";
import { transactionTypes } from "@/lib/constants";

export const consolidationSignedAmount = (
  eb: ExpressionBuilder<DB, "consolidations" | "transactions">
) => {
  return eb
    .case("type")
    .when("income")
    .then(eb.ref("consolidations.amount"))
    .else(eb("consolidations.amount", "*", eb.lit(-1)))
    .end();
};

export const consolidationRevenue = (
  eb: ExpressionBuilder<DB, "consolidations" | "transactions">
) => revenueOrCost(eb, "income");

export const consolidationCost = (
  eb: ExpressionBuilder<DB, "consolidations" | "transactions">
) => revenueOrCost(eb, "expense");

const revenueOrCost = (
  eb: ExpressionBuilder<DB, "consolidations" | "transactions">,
  type: (typeof transactionTypes)[number]
) =>
  eb.and([
    eb("type", "=", type),
    eb("consolidationGroup", "not in", ["loan", "tax", "refund", "refunded"]),
  ]);
