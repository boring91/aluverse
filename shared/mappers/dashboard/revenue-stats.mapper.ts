import { getMonth, getYear } from "@/db/expressions/generic";
import { DB } from "@/db/types";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const revenueStatsTotalMapper = (
  eb: ExpressionBuilder<DB, "consolidations" | "transactions">
) =>
  [
    eb.fn
      .coalesce(eb.fn.sum<number>("consolidations.amount"), eb.lit(0))
      .as("total"),
  ] satisfies SelectExpression<DB, "consolidations" | "transactions">[];

export const revenueTrendMapper = (
  eb: ExpressionBuilder<DB, "consolidations" | "transactions">
) =>
  [
    eb.fn
      .coalesce(eb.fn.sum<number>("consolidations.amount"), eb.lit(0))
      .as("revenue"),
    getMonth(eb.ref("date")).as("month"),
    getYear(eb.ref("date")).as("year"),
  ] satisfies SelectExpression<DB, "consolidations" | "transactions">[];
