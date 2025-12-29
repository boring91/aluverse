import { ExpressionBuilder, SelectExpression } from "kysely";
import { jsonArrayFrom, jsonObjectFrom } from "@/db/json-helpers";
import {
    balance,
    consolidatedAmount,
    cost,
    loanPaid,
    loanRemaining,
    projectPaid,
} from "@/db/expressions"
import { DB } from "@/db/types";

export const projectMapper = (eb: ExpressionBuilder<DB, "projects">) =>
    [
        "id",
        "humanId",
        "client",
        "title",
        "visitDate",
        "startDate",
        "endDate",
        "address",
        "meters",
        "price",
        cost(eb).as("cost"),
        projectPaid(eb).as("paid"),
    ] satisfies SelectExpression<DB, "projects">[];

export const projectSupplyMapper = (): SelectExpression<
    DB,
    "projectSupplies"
>[] =>
    ["id", "name", "quantity", "unitPrice"] satisfies SelectExpression<
        DB,
        "projectSupplies"
    >[];

export const projectLaborMapper = (): SelectExpression<DB, "projectLabors">[] =>
    ["id", "name", "hours", "rate"] satisfies SelectExpression<
        DB,
        "projectLabors"
    >[];

export const projectMiscMapper = (): SelectExpression<DB, "projectMisc">[] =>
    ["id", "name", "amount"] satisfies SelectExpression<DB, "projectMisc">[];

export const projectPaymentMapper = (): SelectExpression<
    DB,
    "projectPayments"
>[] =>
    ["id", "date", "amount"] satisfies SelectExpression<
        DB,
        "projectPayments"
    >[];

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

export const loanMapper = (eb: ExpressionBuilder<DB, "loans">) =>
    [
        "id",
        "type",
        "partyName",
        "amount",
        "date",
        "dueDate",
        "notes",
        loanPaid(eb).as("paid"),
        loanRemaining(eb).as("remaining"),
    ] satisfies SelectExpression<DB, "loans">[];

export const loanPayoffMapper = () =>
    ["id", "date", "amount", "notes"] satisfies SelectExpression<
        DB,
        "loanPayoffs"
    >[];
