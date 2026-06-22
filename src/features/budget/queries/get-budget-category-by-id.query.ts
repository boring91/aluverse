import { db } from "@/db";
import { budgetCategoryListMapper } from "@/shared/mappers/budget/budget-category-list.mapper";

export async function getBudgetCategoryByIdQuery(id: string) {
  return await db
    .selectFrom("budgetCategories")
    .where("id", "=", id)
    .select(budgetCategoryListMapper)
    .executeTakeFirst();
}
