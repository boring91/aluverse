import { ExpressionBuilder, sql } from "kysely";
import { DB } from "@/db/types";

export const currentMonthlyAllocation = (
  eb: ExpressionBuilder<DB, "budgetCategories">
) => {
  return eb
    .selectFrom("budgetCategoryAllocations")
    .whereRef(
      "budgetCategoryAllocations.budgetCategoryId",
      "=",
      "budgetCategories.id"
    )
    .where("budgetCategoryAllocations.effectiveDate", "<=", sql<Date>`now()`)
    .orderBy("budgetCategoryAllocations.effectiveDate", "desc")
    .limit(1)
    .select("budgetCategoryAllocations.amount")
    .$asScalar();
};
