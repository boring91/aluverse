import { ExpressionBuilder, SelectExpression } from "kysely";
import {
  isLoanConsolidated,
  isLoanPayoffConsolidated,
  loanPaid,
  loanRemaining,
  unconsolidatedPayoffsCount as unconsolidatedPayoffCount,
} from "../expressions";
import { DB } from "../types";

export const loanMapper = (eb: ExpressionBuilder<DB, "loans">) =>
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

export const loanPayoffMapper = (eb: ExpressionBuilder<DB, "loanPayoffs">) =>
  [
    "id",
    "date",
    "amount",
    "notes",
    isLoanPayoffConsolidated(eb).as("isConsolidated"),
  ] satisfies SelectExpression<DB, "loanPayoffs">[];
