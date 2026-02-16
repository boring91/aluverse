import { db } from "@/db";
import { budgetCategoryMapper } from "@/db/mappers/budgets.mapper";
import { z } from "zod";
import { updateBudgetCategorySchema } from "../schemas/budgets.schema";

export async function updateBudgetCategory(
  budget: z.infer<typeof updateBudgetCategorySchema>
) {
  const { id, ...data } = budget;

  return await db
    .updateTable("budgetCategories")
    .where("id", "=", id)
    .set(data)
    .returning(budgetCategoryMapper)
    .executeTakeFirstOrThrow();
}
