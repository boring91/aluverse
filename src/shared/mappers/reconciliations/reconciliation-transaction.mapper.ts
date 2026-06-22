import { reconciledAmount } from "@/shared/expressions/transactions/transaction.expression";
import type { DB } from "@/db/types";
import type { ExpressionBuilder, SelectExpression } from "kysely";

export const reconciliationDefaultsMapper = (
  eb: ExpressionBuilder<DB, "transactions">,
) =>
  [
    "description",
    eb("amount", "-", reconciledAmount(eb)).as("remainingAmount"),
  ] satisfies SelectExpression<DB, "transactions">[];

export const pendingReconciliationCountMapper = (
  eb: ExpressionBuilder<DB, "transactions">,
) =>
  [eb.fn.count<number>("id").as("count")] satisfies SelectExpression<
    DB,
    "transactions"
  >[];
