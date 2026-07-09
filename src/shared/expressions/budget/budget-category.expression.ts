import { sql } from "kysely";
import type { ExpressionBuilder } from "kysely";
import type { DB } from "@/db/types";

export const currentMonthlyAllocation = (
  eb: ExpressionBuilder<DB, "budgetCategories">,
) => {
  return eb
    .selectFrom("budgetCategoryAllocations")
    .whereRef(
      "budgetCategoryAllocations.budgetCategoryId",
      "=",
      "budgetCategories.id",
    )
    .where(
      "budgetCategoryAllocations.effectiveDate",
      "<=",
      sql<string>`CURRENT_DATE`,
    )
    .orderBy("budgetCategoryAllocations.effectiveDate", "desc")
    .limit(1)
    .select("budgetCategoryAllocations.amount")
    .$asScalar();
};
