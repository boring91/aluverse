import type { DB } from "@/db/types";
import {
  isLoanReconciled,
  loanPaid,
  loanRemaining,
  unreconciledPayoffsCount as unreconciledPayoffCount,
} from "@/shared/expressions/loans/loan.expression";
import type { ExpressionBuilder, SelectExpression } from "kysely";

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
    isLoanReconciled(eb).as("isReconciled"),
    unreconciledPayoffCount(eb).as("unreconciledPayoffCount"),
  ] satisfies SelectExpression<DB, "loans">[];
