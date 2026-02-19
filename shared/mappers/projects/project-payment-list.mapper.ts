import { DB } from "@/db/types";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const projectPaymentListMapper = (
  eb: ExpressionBuilder<DB, "projectPayments">
) =>
  [
    "id",
    "date",
    "amount",
    eb("reconciliationId", "is not", null).as("isReconciled"),
  ] satisfies SelectExpression<DB, "projectPayments">[];
