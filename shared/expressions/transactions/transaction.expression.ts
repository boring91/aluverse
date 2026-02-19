import { ExpressionBuilder } from "kysely";
import { DB } from "@/db/types";
import { transactionConsolidationGroups } from "@/lib/constants";

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

export const hasBudgetCategoryId = (
  eb: ExpressionBuilder<DB, "transactions">,
  budgetCategoryId: string
) => {
  return eb
    .selectFrom("consolidations")
    .whereRef("transactionId", "=", "transactions.id")
    .where("budgetCategoryId", "=", budgetCategoryId)
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
