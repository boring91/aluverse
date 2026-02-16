import { db } from "@/db";
import { budgetCategoryMapper } from "@/db/mappers/budgets.mapper";

export async function deleteBudgetCategory(id: string) {
  return await db
    .deleteFrom("budgetCategories")
    .where("id", "=", id)
    .returning(budgetCategoryMapper)
    .executeTakeFirstOrThrow();
}
