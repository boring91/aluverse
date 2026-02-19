import { DB } from "@/db/types";
import { balance } from "@/db/expressions";
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
