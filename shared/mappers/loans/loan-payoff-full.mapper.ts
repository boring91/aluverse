import { DB } from "@/db/types";
import { isLoanPayoffConsolidated } from "@/db/expressions";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const loanPayoffFullMapper = (
  eb: ExpressionBuilder<DB, "loanPayoffs">
) =>
  [
    "id",
    "date",
    "amount",
    "notes",
    isLoanPayoffConsolidated(eb).as("isConsolidated"),
  ] satisfies SelectExpression<DB, "loanPayoffs">[];
