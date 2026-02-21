import { DB } from "@/db/types";
import { jsonObjectFrom } from "@/db/json-helpers";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const reconciliationListMapper = (
  eb: ExpressionBuilder<DB, "reconciliations">
) =>
  [
    "id",
    "amount",
    "description",
    "isGst",
    "reconciliationGroup",
    "budgetCategoryId",
    "projectStream",
    "projectItemId",
    "isPayoff",
    jsonObjectFrom(
      eb
        .selectFrom("budgetCategories")
        .whereRef(
          "budgetCategories.id",
          "=",
          "reconciliations.budgetCategoryId"
        )
        .select(["id", "name", "includingGst"])
    ).as("budgetCategory"),
    jsonObjectFrom(
      eb
        .selectFrom("projects")
        .whereRef("projects.id", "=", "reconciliations.projectId")
        .select(["id", "humanId", "title"])
    ).as("project"),
    jsonObjectFrom(
      eb
        .selectFrom("loans")
        .whereRef("loans.id", "=", "reconciliations.loanId")
        .select(["id", "partyName", "amount", "date", "dueDate"])
    ).as("loan"),
    jsonObjectFrom(
      eb
        .selectFrom("loanPayoffs")
        .whereRef("loanPayoffs.id", "=", "reconciliations.loanPayoffId")
        .select(["id", "amount", "date"])
    ).as("loanPayoff"),
    jsonObjectFrom(
      eb
        .selectFrom("transactions")
        .whereRef("transactions.id", "=", "reconciliations.transactionId")
        .select(["id", "date", "description", "amount"])
    )
      .$notNull()
      .as("transaction"),
  ] satisfies SelectExpression<DB, "reconciliations">[];
