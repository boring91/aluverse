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
