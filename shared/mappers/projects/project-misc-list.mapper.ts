import { DB } from "@/db/types";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const projectMiscListMapper = (
  eb: ExpressionBuilder<DB, "projectMisc">
) =>
  [
    "id",
    "name",
    "amount",
    eb("consolidationId", "is not", null).as("isConsolidated"),
  ] satisfies SelectExpression<DB, "projectMisc">[];
