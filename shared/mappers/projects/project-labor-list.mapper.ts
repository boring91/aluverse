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
    eb("consolidationId", "is not", null).as("isConsolidated"),
  ] satisfies SelectExpression<DB, "projectLabors">[];

export const projectLaborCountMapper = (
  eb: ExpressionBuilder<DB, "projectLabors">
) =>
  [eb.fn.count<number>("id").as("count")] satisfies SelectExpression<
    DB,
    "projectLabors"
  >[];
