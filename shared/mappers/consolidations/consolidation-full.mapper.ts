import { DB } from "@/db/types";
import { balance } from "@/shared/expressions/financial-accounts/financial-account.expression";
import { jsonObjectFrom } from "@/db/json-helpers";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const consolidationFullMapper = (
  eb: ExpressionBuilder<DB, "consolidations">
) =>
  [
    "id",
    "amount",
    "description",
    "isGst",
    "consolidationGroup",
    "budgetCategoryId",
    "projectStream",
    "projectItemId",
    "isPayoff",
    jsonObjectFrom(
      eb
        .selectFrom("budgetCategories")
        .whereRef("budgetCategories.id", "=", "consolidations.budgetCategoryId")
        .select(["id", "humanId", "name", "includingGst"])
    ).as("budgetCategory"),
    jsonObjectFrom(
      eb
        .selectFrom("projects")
        .whereRef("projects.id", "=", "consolidations.projectId")
        .select(["id", "humanId", "title"])
    ).as("project"),
    jsonObjectFrom(
      eb
        .selectFrom("loans")
        .whereRef("loans.id", "=", "consolidations.loanId")
        .select(["id", "partyName", "amount", "date", "dueDate"])
    ).as("loan"),
    jsonObjectFrom(
      eb
        .selectFrom("loanPayoffs")
        .whereRef("loanPayoffs.id", "=", "consolidations.loanPayoffId")
        .select(["id", "amount", "date"])
    ).as("loanPayoff"),
    jsonObjectFrom(
      eb
        .selectFrom("transactions")
        .whereRef("transactions.id", "=", "consolidations.transactionId")
        .select(["id", "date", "description", "amount"])
    )
      .$notNull()
      .as("transaction"),
  ] satisfies SelectExpression<DB, "consolidations">[];

export const financialAccountFullMapper = (
  eb: ExpressionBuilder<DB, "financialAccounts">
) =>
  [
    "id",
    "name",
    "syncWithBank",
    balance(eb).as("balance"),
  ] satisfies SelectExpression<DB, "financialAccounts">[];
