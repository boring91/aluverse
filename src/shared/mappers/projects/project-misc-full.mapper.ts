import type { DB } from "@/db/types";
import type { ExpressionBuilder, SelectExpression } from "kysely";

export const projectMiscFullMapper = (
  eb: ExpressionBuilder<DB, "projectMisc">,
) =>
  [
    "id",
    "name",
    "amount",
    eb("reconciliationId", "is not", null).as("isReconciled"),
  ] satisfies SelectExpression<DB, "projectMisc">[];
