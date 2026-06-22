import type { z } from "zod";
import type { createBudgetCategorySchema } from "../schemas/budgets.shared-schema";
import { db } from "@/db";
import { budgetCategoryListMapper } from "@/shared/mappers/budget/budget-category-list.mapper";

export async function createBudgetCategoryMutation(
  budget: z.infer<typeof createBudgetCategorySchema>,
) {
  return await db
    .insertInto("budgetCategories")
    .values(budget)
    .returning(budgetCategoryListMapper)
    .executeTakeFirstOrThrow();
}
