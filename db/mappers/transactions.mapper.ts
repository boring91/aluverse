import { ExpressionBuilder, SelectExpression } from "kysely";
import { jsonArrayFrom, jsonObjectFrom } from "../json-helpers";
import { consolidatedAmount, isTransactionConsolidated } from "../expressions";
import { DB } from "../types";

export const transactionMapper = (eb: ExpressionBuilder<DB, "transactions">) =>
  [
    "id",
    "date",
    "amount",
    "description",
    isTransactionConsolidated(eb).as("isConsolidated"),
    consolidatedAmount(eb).as("consolidatedAmount"),

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
        .selectFrom("consolidations")
        .whereRef("consolidations.transactionId", "=", "transactions.id")
        .select((y) => [
          "id",
          "consolidationGroup",
          "description",
          "isGst",
          "budgetCategory",
          "amount",

          jsonObjectFrom(
            y
              .selectFrom("projects")
              .whereRef("projects.id", "=", "consolidations.projectId")
              .select(["id", "humanId", "title"])
          ).as("project"),
        ])
    ).as("consolidations"),
  ] satisfies SelectExpression<DB, "transactions">[];
