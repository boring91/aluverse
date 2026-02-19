import { db } from "@/db";
import { budgetCategoryAllocationListMapper } from "@/shared/mappers/budget/budget-category-allocation-list.mapper";

export async function getBudgetCategoryAllocationByIdQuery(id: string) {
  return await db
    .selectFrom("budgetCategoryAllocations")
    .where("id", "=", id)
    .select(budgetCategoryAllocationListMapper)
    .executeTakeFirst();
}
