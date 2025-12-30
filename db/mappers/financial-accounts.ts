import { ExpressionBuilder, SelectExpression } from "kysely";
import { jsonArrayFrom, jsonObjectFrom } from "../json-helpers";
import { consolidatedAmount } from "../expressions";
import { DB } from "../types";

export const transactionMapper = (eb: ExpressionBuilder<DB, "transactions">) =>
    [
        "id",
        "date",
        "amount",
        "type",
        "description",
        "accountId",
        consolidatedAmount(eb).as("consolidatedAmount"),

        jsonArrayFrom(
            eb
                .selectFrom("consolidations")
                .whereRef(
                    "consolidations.transactionId",
                    "=",
                    "transactions.id"
                )
                .select(y => [
                    "id",
                    "consolidationGroup",
                    "description",
                    "isGst",
                    "budgetCategory",
                    "amount",

                    jsonObjectFrom(
                        y
                            .selectFrom("projects")
                            .whereRef(
                                "projects.id",
                                "=",
                                "consolidations.projectId"
                            )
                            .select(["id", "humanId", "title"])
                    ).as("project"),
                ])
        ).as("consolidations"),
    ] satisfies SelectExpression<DB, "transactions">[];
