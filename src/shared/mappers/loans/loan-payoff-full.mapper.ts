import type { DB } from "@/db/types";
import { isLoanPayoffReconciled } from "@/shared/expressions/loans/loan.expression";
import type { ExpressionBuilder, SelectExpression } from "kysely";

export const loanPayoffFullMapper = (
  eb: ExpressionBuilder<DB, "loanPayoffs">,
) =>
  [
    "id",
    "date",
    "amount",
    "notes",
    isLoanPayoffReconciled(eb).as("isReconciled"),
  ] satisfies SelectExpression<DB, "loanPayoffs">[];
