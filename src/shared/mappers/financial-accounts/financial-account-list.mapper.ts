import type { DB } from "@/db/types";
import { balance } from "@/shared/expressions/financial-accounts/financial-account.expression";
import type { ExpressionBuilder, SelectExpression } from "kysely";

export const financialAccountListMapper = (
  eb: ExpressionBuilder<DB, "financialAccounts">,
) =>
  [
    "id",
    "name",
    "frolloAccountId",
    balance(eb).as("balance"),
  ] satisfies SelectExpression<DB, "financialAccounts">[];
