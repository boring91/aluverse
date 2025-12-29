import { ExpressionBuilder } from "kysely";
import { DB } from './types';

export const projectPaid = (eb: ExpressionBuilder<DB, "projects">) =>
    eb
        .selectFrom("projectPayments")
        .whereRef("projectPayments.projectId", "=", "projects.id")
        .select(sub =>
            sub.fn
                .coalesce(
                    sub.fn.sum<number>("projectPayments.amount"),
                    sub.lit(0)
                )
                .as("paid")
        )
        .$asScalar();

export const suppliesCost = (eb: ExpressionBuilder<DB, "projects">) =>
    eb
        .selectFrom("projectSupplies")
        .whereRef("projectSupplies.projectId", "=", "projects.id")
        .select(sub =>
            sub.fn
                .coalesce(
                    sub.fn.sum<number>(
                        sub("quantity", "*", sub.ref("unitPrice"))
                    ),
                    sub.lit(0)
                )
                .as("suppliesCost")
        );

export const laborCost = (eb: ExpressionBuilder<DB, "projects">) =>
    eb
        .selectFrom("projectLabors")
        .whereRef("projectLabors.projectId", "=", "projects.id")
        .select(sub =>
            sub.fn
                .coalesce(
                    sub.fn.sum<number>(sub("rate", "*", sub.ref("hours"))),
                    sub.lit(0)
                )
                .as("laborCost")
        );

export const miscCost = (eb: ExpressionBuilder<DB, "projects">) =>
    eb
        .selectFrom("projectMisc")
        .whereRef("projectMisc.projectId", "=", "projects.id")
        .select(sub =>
            sub.fn
                .coalesce(sub.fn.sum<number>("projectMisc.amount"), sub.lit(0))
                .as("miscCost")
        );

export const cost = (eb: ExpressionBuilder<DB, "projects">) =>
    eb(eb(suppliesCost, "+", laborCost), "+", miscCost).$notNull();

export const consolidatedAmount = (
    eb: ExpressionBuilder<DB, "transactions">
) => {
    return eb
        .selectFrom("consolidations")
        .whereRef("consolidations.transactionId", "=", "transactions.id")
        .select(sub =>
            sub.fn.coalesce(sub.fn.sum<number>("amount"), sub.lit(0)).as("sum")
        )
        .$asScalar();
};

export const balance = (eb: ExpressionBuilder<DB, "financialAccounts">) => {
    return eb
        .selectFrom("transactions")
        .whereRef("transactions.accountId", "=", "financialAccounts.id")
        .select(sub =>
            sub.fn
                .coalesce(
                    sub.fn.sum<number>(
                        sub
                            .case("type")
                            .when("income")
                            .then(sub.ref("amount"))
                            .else(sub("amount", "*", sub.lit(-1)))
                            .end()
                    ),
                    sub.lit(0)
                )
                .as("balance")
        )
        .$asScalar();
};

export const loanPaid = (eb: ExpressionBuilder<DB, "loans">) => {
    return eb
        .selectFrom("loanPayoffs")
        .whereRef("loanPayoffs.loanId", "=", "loans.id")
        .select(sub =>
            sub.fn.coalesce(sub.fn.sum<number>("amount"), sub.lit(0)).as("paid")
        )
        .$asScalar();
};

export const loanRemaining = (eb: ExpressionBuilder<DB, "loans">) =>
    eb("amount", "-", loanPaid(eb)).$notNull();
