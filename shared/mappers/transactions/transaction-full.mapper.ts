import { DB } from "@/db/types";
import {
  reconciledAmount,
  isTransactionReconciled,
} from "@/shared/expressions/transactions/transaction.expression";
import { jsonArrayFrom, jsonObjectFrom } from "@/db/json-helpers";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const transactionFullMapper = (
  eb: ExpressionBuilder<DB, "transactions">
) =>
  [
    "id",
    "date",
    "amount",
    "description",
    isTransactionReconciled(eb).as("isReconciled"),
    reconciledAmount(eb).as("reconciledAmount"),
    jsonObjectFrom(
      eb
        .selectFrom("financialAccounts")
        .whereRef("financialAccounts.id", "=", "transactions.accountId")
        .select(["financialAccounts.id", "financialAccounts.name"])
    )
      .$notNull()
      .as("account"),
    jsonArrayFrom(
      eb
        .selectFrom("reconciliations")
        .whereRef("reconciliations.transactionId", "=", "transactions.id")
        .select((y) => [
          "id",
          "reconciliationGroup",
          "description",
          "isGst",
          "budgetCategoryId",
          "amount",
          jsonObjectFrom(
            y
              .selectFrom("budgetCategories")
              .whereRef(
                "budgetCategories.id",
                "=",
                "reconciliations.budgetCategoryId"
              )
              .select(["id", "name", "includingGst"])
          ).as("budgetCategory"),
          jsonObjectFrom(
            y
              .selectFrom("projects")
              .whereRef("projects.id", "=", "reconciliations.projectId")
              .select(["id", "humanId", "title"])
          ).as("project"),
        ])
    ).as("reconciliations"),
  ] satisfies SelectExpression<DB, "transactions">[];
