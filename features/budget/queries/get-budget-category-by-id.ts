import { db } from "@/db";
import { budgetCategoryMapper } from "@/db/mappers/budgets.mapper";

export async function getBudgetCategoryById(id: string) {
  return await db
    .selectFrom("budgetCategories")
    .where("id", "=", id)
    .select(budgetCategoryMapper)
    .executeTakeFirst();
}
