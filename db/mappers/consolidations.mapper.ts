import { ExpressionBuilder, SelectExpression } from "kysely";
import { jsonObjectFrom } from "../json-helpers";
import { balance } from "../expressions";
import { DB } from "../types";

export const consolidationMapper = (
  eb: ExpressionBuilder<DB, "consolidations">
) =>
  [
    "id",
    "amount",
    "description",
    "isGst",
    "consolidationGroup",
    "budgetCategory",
    "projectStream",
    "projectItemId",
    "isPayoff",

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
        .select(["id", "date", "description", "amount", "type"])
    )
      .$notNull()
      .as("transaction"),
  ] satisfies SelectExpression<DB, "consolidations">[];

export const financialAccountMapper = (
  eb: ExpressionBuilder<DB, "financialAccounts">
) =>
  [
    "id",
    "name",
    "syncWithBank",
    balance(eb).as("balance"),
  ] satisfies SelectExpression<DB, "financialAccounts">[];
