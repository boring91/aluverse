import { db } from "@/db";
import { budgetCategoryListMapper } from "@/shared/mappers/budget/budget-category-list.mapper";
import { z } from "zod";
import { updateBudgetCategorySchema } from "../schemas/budgets.shared-schema";

export async function updateBudgetCategoryMutation(
  budget: z.infer<typeof updateBudgetCategorySchema>
) {
  const { id, ...data } = budget;

  return await db
    .updateTable("budgetCategories")
    .where("id", "=", id)
    .set(data)
    .returning(budgetCategoryListMapper)
    .executeTakeFirstOrThrow();
}
