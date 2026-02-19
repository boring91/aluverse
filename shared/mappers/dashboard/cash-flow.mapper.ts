import {
  getMonth,
  getYear,
} from "@/shared/expressions/generic/date.expression";
import { DB } from "@/db/types";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const cashFlowMapper = (eb: ExpressionBuilder<DB, "transactions">) =>
  [
    eb.fn
      .sum<number>(
        eb
          .case()
          .when("amount", ">", eb.lit(0))
          .then(eb.ref("amount"))
          .else(eb.lit(0))
          .end()
      )
      .as("income"),
    eb.fn
      .sum<number>(
        eb
          .case()
          .when("amount", "<", eb.lit(0))
          .then(eb.ref("amount"))
          .else(eb.lit(0))
          .end()
      )
      .as("expense"),
    getMonth(eb.ref("date")).as("month"),
    getYear(eb.ref("date")).as("year"),
  ] satisfies SelectExpression<DB, "transactions">[];
