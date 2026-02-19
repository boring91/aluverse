import { DB } from "@/db/types";
import { balance } from "@/shared/expressions/financial-accounts/financial-account.expression";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const financialAccountFullMapper = (
  eb: ExpressionBuilder<DB, "financialAccounts">
) =>
  [
    "id",
    "name",
    "syncWithBank",
    balance(eb).as("balance"),
  ] satisfies SelectExpression<DB, "financialAccounts">[];
