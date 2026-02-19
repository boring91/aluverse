import { DB } from "@/db/types";
import {
  consolidatedAmount,
  isTransactionConsolidated,
} from "@/shared/expressions/transactions/transaction.expression";
import { jsonArrayFrom, jsonObjectFrom } from "@/db/json-helpers";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const transactionListMapper = (
  eb: ExpressionBuilder<DB, "transactions">
) =>
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

export const transactionCountMapper = (
  eb: ExpressionBuilder<DB, "transactions">
) =>
  [eb.fn.count<number>("id").as("count")] satisfies SelectExpression<
    DB,
    "transactions"
  >[];
