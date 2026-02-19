import { consolidatedAmount } from "@/shared/expressions/transactions/transaction.expression";
import { DB } from "@/db/types";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const consolidationDefaultsMapper = (
  eb: ExpressionBuilder<DB, "transactions">
) =>
  [
    "description",
    eb("amount", "-", consolidatedAmount(eb)).as("remainingAmount"),
  ] satisfies SelectExpression<DB, "transactions">[];

export const pendingConsolidationCountMapper = (
  eb: ExpressionBuilder<DB, "transactions">
) =>
  [eb.fn.count<number>("id").as("count")] satisfies SelectExpression<
    DB,
    "transactions"
  >[];
