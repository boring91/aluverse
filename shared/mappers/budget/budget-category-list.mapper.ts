import { DB } from "@/db/types";
import { currentMonthlyAllocation } from "@/shared/expressions/budget/budget-category.expression";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const budgetCategoryListMapper = (
  eb: ExpressionBuilder<DB, "budgetCategories">
) =>
  [
    "budgetCategories.id",
    "budgetCategories.name",
    "budgetCategories.includingGst",
    eb.fn
      .coalesce(currentMonthlyAllocation(eb), eb.lit(0))
      .as("monthlyAllocation"),
  ] satisfies SelectExpression<DB, "budgetCategories">[];
