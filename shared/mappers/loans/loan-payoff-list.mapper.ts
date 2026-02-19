import { DB } from "@/db/types";
import { isLoanPayoffConsolidated } from "@/db/expressions";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const loanPayoffListMapper = (
  eb: ExpressionBuilder<DB, "loanPayoffs">
) =>
  [
    "id",
    "date",
    "amount",
    "notes",
    isLoanPayoffConsolidated(eb).as("isConsolidated"),
  ] satisfies SelectExpression<DB, "loanPayoffs">[];

export const loanPayoffCountMapper = (
  eb: ExpressionBuilder<DB, "loanPayoffs">
) =>
  [eb.fn.count<number>("id").as("count")] satisfies SelectExpression<
    DB,
    "loanPayoffs"
  >[];
