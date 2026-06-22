import type { DB } from "@/db/types";
import type { ExpressionBuilder, SelectExpression } from "kysely";

export const projectMiscListMapper = (
  eb: ExpressionBuilder<DB, "projectMisc">,
) =>
  [
    "id",
    "name",
    "amount",
    eb("reconciliationId", "is not", null).as("isReconciled"),
  ] satisfies SelectExpression<DB, "projectMisc">[];
