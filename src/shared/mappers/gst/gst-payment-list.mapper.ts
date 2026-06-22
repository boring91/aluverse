import type { DB } from "@/db/types";
import type { ExpressionBuilder, SelectExpression } from "kysely";

export const gstPaymentListMapper = (
  eb: ExpressionBuilder<DB, "gstPayments">,
) =>
  [
    "id",
    "periodFrom",
    "periodTo",
    "rate",
    "amount",
    "reconciliationId",
    eb("reconciliationId", "is not", null).as("isReconciled"),
    "createdAt",
  ] satisfies SelectExpression<DB, "gstPayments">[];
