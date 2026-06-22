import type { DB } from "@/db/types";
import type { SelectExpression } from "kysely";

export const budgetCategoryAllocationFullMapper = () =>
  [
    "id",
    "budgetCategoryId",
    "amount",
    "effectiveDate",
  ] satisfies SelectExpression<DB, "budgetCategoryAllocations">[];
