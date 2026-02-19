import { DB } from "@/db/types";
import {
  isLoanConsolidated,
  loanPaid,
  loanRemaining,
  unconsolidatedPayoffsCount as unconsolidatedPayoffCount,
} from "@/db/expressions";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const loanFullMapper = (eb: ExpressionBuilder<DB, "loans">) =>
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
