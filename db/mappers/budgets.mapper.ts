import { SelectExpression } from "kysely";
import { DB } from "../types";

export const budgetCategoryMapper = () =>
  [
    "budgetCategories.id",
    "budgetCategories.humanId",
    "budgetCategories.name",
  ] satisfies SelectExpression<DB, "budgetCategories">[];
