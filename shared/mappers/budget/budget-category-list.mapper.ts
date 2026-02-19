import { DB } from "@/db/types";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const budgetCategoryListMapper = () =>
  [
    "budgetCategories.id",
    "budgetCategories.humanId",
    "budgetCategories.name",
  ] satisfies SelectExpression<DB, "budgetCategories">[];

export const budgetCategoryCountMapper = (
  eb: ExpressionBuilder<DB, "budgetCategories">
) =>
  [eb.fn.count<number>("id").as("count")] satisfies SelectExpression<
    DB,
    "budgetCategories"
  >[];
