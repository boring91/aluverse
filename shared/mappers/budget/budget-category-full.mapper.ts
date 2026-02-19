import { DB } from "@/db/types";
import { SelectExpression } from "kysely";

export const budgetCategoryFullMapper = () =>
  [
    "budgetCategories.id",
    "budgetCategories.humanId",
    "budgetCategories.name",
  ] satisfies SelectExpression<DB, "budgetCategories">[];
