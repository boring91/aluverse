import { DB } from "@/db/types";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const projectLaborListMapper = (
  eb: ExpressionBuilder<DB, "projectLabors">
) =>
  [
    "id",
    "name",
    "hours",
    "rate",
    eb("reconciliationId", "is not", null).as("isReconciled"),
  ] satisfies SelectExpression<DB, "projectLabors">[];
