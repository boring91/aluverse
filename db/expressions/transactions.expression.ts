import { ExpressionBuilder } from "kysely";
import { DB } from "../types";
import {
  transactionBudgetCategories,
  transactionConsolidationGroups,
} from "@/lib/constants";

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

export const transactionSignedAmount = (
  eb: ExpressionBuilder<DB, "transactions">
) => {
  return eb
    .case("type")
    .when("income")
    .then(eb.ref("amount"))
    .else(eb("amount", "*", eb.lit(-1)))
    .end();
};

export const hasGst = (eb: ExpressionBuilder<DB, "transactions">) => {
  return eb
    .selectFrom("consolidations")
    .whereRef("transactionId", "=", "transactions.id")
    .where("isGst", "=", true)
    .select((sub) => eb(sub.fn.count("id"), ">", eb.lit(0)).as("hasGst"))
    .$asScalar();
};

export const hasConsolidationGroup = (
  eb: ExpressionBuilder<DB, "transactions">,
  group: (typeof transactionConsolidationGroups)[number]
) => {
  return eb
    .selectFrom("consolidations")
    .whereRef("transactionId", "=", "transactions.id")
    .where("consolidationGroup", "=", group)
    .select((sub) => eb(sub.fn.count("id"), ">", eb.lit(0)).as("hasGroup"))
    .$asScalar();
};

export const hasBudgetCategory = (
  eb: ExpressionBuilder<DB, "transactions">,
  category: (typeof transactionBudgetCategories)[number]
) => {
  return eb
    .selectFrom("consolidations")
    .whereRef("transactionId", "=", "transactions.id")
    .where("budgetCategory", "=", category)
    .select((sub) => eb(sub.fn.count("id"), ">", eb.lit(0)).as("hasCategory"))
    .$asScalar();
};

export const hasProject = (
  eb: ExpressionBuilder<DB, "transactions">,
  projectId: string
) => {
  return eb
    .selectFrom("consolidations")
    .whereRef("transactionId", "=", "transactions.id")
    .where("projectId", "=", projectId)
    .select((sub) => eb(sub.fn.count("id"), ">", eb.lit(0)).as("hasProject"))
    .$asScalar();
};
