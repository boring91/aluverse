import { DB } from "@/db/types";
import {
  isLoanConsolidated,
  loanPaid,
  loanRemaining,
  unconsolidatedPayoffsCount as unconsolidatedPayoffCount,
} from "@/shared/expressions/loans/loan.expression";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const loanListMapper = (eb: ExpressionBuilder<DB, "loans">) =>
  [
    "id",
    "type",
    "partyName",
    "amount",
    "date",
    "dueDate",
    "notes",
    loanPaid(eb).as("paid"),
    loanRemaining(eb).as("remaining"),
    isLoanConsolidated(eb).as("isConsolidated"),
    unconsolidatedPayoffCount(eb).as("unconsolidatedPayoffCount"),
  ] satisfies SelectExpression<DB, "loans">[];

export const loanCountMapper = (eb: ExpressionBuilder<DB, "loans">) =>
  [eb.fn.count<number>("id").as("count")] satisfies SelectExpression<
    DB,
    "loans"
  >[];
