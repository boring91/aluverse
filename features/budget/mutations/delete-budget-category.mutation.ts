import { db } from "@/db";
import { budgetCategoryListMapper } from "@/shared/mappers/budget/budget-category-list.mapper";

export async function deleteBudgetCategoryMutation(id: string) {
  return await db
    .deleteFrom("budgetCategories")
    .where("id", "=", id)
    .returning(budgetCategoryListMapper)
    .executeTakeFirstOrThrow();
}
