import type { DB } from "@/db/types";
import type { ExpressionBuilder, SelectExpression } from "kysely";

export const projectLaborFullMapper = (
  eb: ExpressionBuilder<DB, "projectLabors">,
) =>
  [
    "id",
    "name",
    "hours",
    "rate",
    eb("reconciliationId", "is not", null).as("isReconciled"),
  ] satisfies SelectExpression<DB, "projectLabors">[];
