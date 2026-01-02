import { ExpressionBuilder } from "kysely";
import { DB } from "../types";

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

export const isLoanConsolidated = (eb: ExpressionBuilder<DB, "loans">) => {
  return eb("consolidationId", "is not", null).$notNull();
};

export const isLoanPayoffConsolidated = (
  eb: ExpressionBuilder<DB, "loanPayoffs">
) => {
  return eb("consolidationId", "is not", null).$notNull();
};

export const unconsolidatedPayoffsCount = (
  eb: ExpressionBuilder<DB, "loans">
) =>
  eb
    .selectFrom("loanPayoffs")
    .whereRef("loanPayoffs.loanId", "=", "loans.id")
    .where("consolidationId", "is", null)
    .select((sub) =>
      sub.fn.count<number>("id").as("unconsolidatedPayoffsCount")
    )
    .$asScalar();
