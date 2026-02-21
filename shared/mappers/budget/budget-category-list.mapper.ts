import { DB } from "@/db/types";
import { SelectExpression } from "kysely";

export const budgetCategoryListMapper = () =>
  [
    "budgetCategories.id",
    "budgetCategories.name",
    "budgetCategories.includingGst",
  ] satisfies SelectExpression<DB, "budgetCategories">[];
