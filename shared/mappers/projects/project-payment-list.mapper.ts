import { DB } from "@/db/types";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const projectPaymentListMapper = (
  eb: ExpressionBuilder<DB, "projectPayments">
) =>
  [
    "id",
    "date",
    "amount",
    eb("consolidationId", "is not", null).as("isConsolidated"),
  ] satisfies SelectExpression<DB, "projectPayments">[];
