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
    eb("consolidationId", "is not", null).as("isConsolidated"),
  ] satisfies SelectExpression<DB, "projectSupplies">[];
