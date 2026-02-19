import { ExpressionBuilder } from "kysely";
import { DB } from "@/db/types";
import { transactionReconciliationGroups } from "@/lib/constants";

export const reconciledAmount = (eb: ExpressionBuilder<DB, "transactions">) => {
  return eb
    .selectFrom("reconciliations")
    .whereRef("reconciliations.transactionId", "=", "transactions.id")
    .select((sub) =>
      sub.fn.coalesce(sub.fn.sum<number>("amount"), sub.lit(0)).as("sum")
    )
    .$asScalar();
};

export const isTransactionReconciled = (
  eb: ExpressionBuilder<DB, "transactions">
) => {
  return eb
    .selectFrom("reconciliations")
    .whereRef("reconciliations.transactionId", "=", "transactions.id")
    .select((sub) =>
      sub
        .case()
        .when(
          eb(sub.fn.count<number>("id"), ">", sub.lit(0)).and(
            sub.fn.sum<number>("reconciliations.amount"),
            "=",
            sub.ref("transactions.amount")
          )
        )
        .then(sub.lit(true))
        .else(sub.lit(false))
        .end()
        .as("isReconciled")
    )
    .$asScalar();
};

export const hasGst = (eb: ExpressionBuilder<DB, "transactions">) => {
  return eb
    .selectFrom("reconciliations")
    .whereRef("transactionId", "=", "transactions.id")
    .where("isGst", "=", true)
    .select((sub) => eb(sub.fn.count("id"), ">", eb.lit(0)).as("hasGst"))
    .$asScalar();
};

export const hasReconciliationGroup = (
  eb: ExpressionBuilder<DB, "transactions">,
  group: (typeof transactionReconciliationGroups)[number]
) => {
  return eb
    .selectFrom("reconciliations")
    .whereRef("transactionId", "=", "transactions.id")
    .where("reconciliationGroup", "=", group)
    .select((sub) => eb(sub.fn.count("id"), ">", eb.lit(0)).as("hasGroup"))
    .$asScalar();
};

export const hasBudgetCategoryId = (
  eb: ExpressionBuilder<DB, "transactions">,
  budgetCategoryId: string
) => {
  return eb
    .selectFrom("reconciliations")
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
    .selectFrom("reconciliations")
    .whereRef("transactionId", "=", "transactions.id")
    .where("projectId", "=", projectId)
    .select((sub) => eb(sub.fn.count("id"), ">", eb.lit(0)).as("hasProject"))
    .$asScalar();
};
