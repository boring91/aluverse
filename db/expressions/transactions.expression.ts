import { ExpressionBuilder } from "kysely";
import { DB } from "../types";

export const consolidatedAmount = (
  eb: ExpressionBuilder<DB, "transactions">
) => {
  return eb
    .selectFrom("consolidations")
    .whereRef("consolidations.transactionId", "=", "transactions.id")
    .select((sub) =>
      sub.fn.coalesce(sub.fn.sum<number>("amount"), sub.lit(0)).as("sum")
    )
    .$asScalar();
};

export const isTransactionConsolidated = (
  eb: ExpressionBuilder<DB, "transactions">
) => {
  return eb
    .selectFrom("consolidations")
    .whereRef("consolidations.transactionId", "=", "transactions.id")
    .select((sub) =>
      sub
        .case()
        .when(
          eb(sub.fn.count<number>("id"), ">", sub.lit(0)).and(
            sub.fn.sum<number>("consolidations.amount"),
            "=",
            sub.ref("transactions.amount")
          )
        )
        .then(sub.lit(true))
        .else(sub.lit(false))
        .end()
        .as("isConsolidated")
    )
    .$asScalar();
};

export const signedAmount = (eb: ExpressionBuilder<DB, "transactions">) => {
  return eb
    .case("type")
    .when("income")
    .then(eb.ref("amount"))
    .else(eb("amount", "*", eb.lit(-1)))
    .end();
};
