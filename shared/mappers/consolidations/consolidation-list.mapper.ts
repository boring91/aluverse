import { DB } from "@/db/types";
import { jsonObjectFrom } from "@/db/json-helpers";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const consolidationListMapper = (
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
        .select(["id", "date", "description", "amount"])
    )
      .$notNull()
      .as("transaction"),
  ] satisfies SelectExpression<DB, "consolidations">[];

export const consolidationCountMapper = (
  eb: ExpressionBuilder<DB, "consolidations">
) =>
  [eb.fn.count<number>("id").as("count")] satisfies SelectExpression<
    DB,
    "consolidations"
  >[];
