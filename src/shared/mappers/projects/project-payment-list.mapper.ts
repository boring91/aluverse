import type { DB } from "@/db/types";
import type { ExpressionBuilder, SelectExpression } from "kysely";

export const projectPaymentListMapper = (
  eb: ExpressionBuilder<DB, "projectPayments">,
) =>
  [
    "id",
    "date",
    "amount",
    eb("reconciliationId", "is not", null).as("isReconciled"),
  ] satisfies SelectExpression<DB, "projectPayments">[];
