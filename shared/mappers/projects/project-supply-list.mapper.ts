import { DB } from "@/db/types";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const projectSupplyListMapper = (
  eb: ExpressionBuilder<DB, "projectSupplies">
) =>
  [
    "id",
    "name",
    "quantity",
    "unitPrice",
    eb("reconciliationId", "is not", null).as("isReconciled"),
  ] satisfies SelectExpression<DB, "projectSupplies">[];
