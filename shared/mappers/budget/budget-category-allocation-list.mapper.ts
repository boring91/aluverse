import { DB } from "@/db/types";
import { SelectExpression } from "kysely";

export const budgetCategoryAllocationListMapper = () =>
  [
    "id",
    "budgetCategoryId",
    "amount",
    "effectiveDate",
  ] satisfies SelectExpression<DB, "budgetCategoryAllocations">[];
