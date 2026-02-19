import { DB } from "@/db/types";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const generalStatsTotalMapper = (
  eb: ExpressionBuilder<DB, "consolidations" | "transactions">
) =>
  [
    eb.fn
      .coalesce(eb.fn.sum<number>("consolidations.amount"), eb.lit(0))
      .as("total"),
  ] satisfies SelectExpression<DB, "consolidations" | "transactions">[];
