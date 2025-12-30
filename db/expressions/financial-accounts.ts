import { ExpressionBuilder } from "kysely";
import { DB } from "../types";

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
