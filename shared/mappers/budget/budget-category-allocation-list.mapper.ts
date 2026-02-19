import { DB } from "@/db/types";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const budgetCategoryAllocationListMapper = () =>
  [
    "id",
    "budgetCategoryId",
    "amount",
    "effectiveDate",
  ] satisfies SelectExpression<DB, "budgetCategoryAllocations">[];

export const budgetCategoryAllocationCountMapper = (
  eb: ExpressionBuilder<DB, "budgetCategoryAllocations">
) =>
  [eb.fn.count<number>("id").as("count")] satisfies SelectExpression<
    DB,
    "budgetCategoryAllocations"
  >[];
