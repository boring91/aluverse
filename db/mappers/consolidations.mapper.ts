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

        jsonObjectFrom(
            eb
                .selectFrom("projects")
                .whereRef("projects.id", "=", "consolidations.projectId")
                .select(["id", "humanId", "title"])
        ).as("project"),

        jsonObjectFrom(
            eb
                .selectFrom("transactions")
                .whereRef(
                    "transactions.id",
                    "=",
                    "consolidations.transactionId"
                )
                .select(["id", "date", "description", "amount", "type"])
        )
            .$notNull()
            .as("transaction"),
    ] satisfies SelectExpression<DB, "consolidations">[];

export const financialAccountMapper = (
    eb: ExpressionBuilder<DB, "financialAccounts">
) =>
    ["id", "name", balance(eb).as("balance")] satisfies SelectExpression<
        DB,
        "financialAccounts"
    >[];
