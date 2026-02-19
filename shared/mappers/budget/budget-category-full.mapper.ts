import { DB } from "@/db/types";
import { SelectExpression } from "kysely";

export const budgetCategoryFullMapper = () =>
  [
    "budgetCategories.id",
    "budgetCategories.humanId",
    "budgetCategories.name",
    "budgetCategories.includingGst",
  ] satisfies SelectExpression<DB, "budgetCategories">[];
