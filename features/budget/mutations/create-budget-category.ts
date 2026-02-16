import { z } from "zod";
import { createBudgetCategorySchema } from "../schemas/budgets.schema";
import { db } from "@/db";
import { budgetCategoryMapper } from "@/db/mappers/budgets.mapper";

export async function createBudgetCategory(
  budget: z.infer<typeof createBudgetCategorySchema>
) {
  return await db
    .insertInto("budgetCategories")
    .values(budget)
    .returning(budgetCategoryMapper)
    .execute();
}
