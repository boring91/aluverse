import type { DB } from "@/db/types";
import type { SelectExpression } from "kysely";

export const budgetCategoryFullMapper = () =>
  [
    "budgetCategories.id",
    "budgetCategories.name",
    "budgetCategories.includingGst",
  ] satisfies SelectExpression<DB, "budgetCategories">[];
