import { ExpressionBuilder } from "kysely";
import { DB } from "@/db/types";

export const loanPaid = (eb: ExpressionBuilder<DB, "loans">) => {
  return eb
    .selectFrom("loanPayoffs")
    .whereRef("loanPayoffs.loanId", "=", "loans.id")
    .select((sub) =>
      sub.fn.coalesce(sub.fn.sum<number>("amount"), sub.lit(0)).as("paid")
    )
    .$asScalar();
};

export const loanRemaining = (eb: ExpressionBuilder<DB, "loans">) =>
  eb("amount", "-", loanPaid(eb)).$notNull();

export const isLoanReconciled = (eb: ExpressionBuilder<DB, "loans">) => {
  return eb("reconciliationId", "is not", null).$notNull();
};

export const isLoanPayoffReconciled = (
  eb: ExpressionBuilder<DB, "loanPayoffs">
) => {
  return eb("reconciliationId", "is not", null).$notNull();
};

export const unreconciledPayoffsCount = (eb: ExpressionBuilder<DB, "loans">) =>
  eb
    .selectFrom("loanPayoffs")
    .whereRef("loanPayoffs.loanId", "=", "loans.id")
    .where("reconciliationId", "is", null)
    .select((sub) => sub.fn.count<number>("id").as("unreconciledPayoffsCount"))
    .$asScalar();
