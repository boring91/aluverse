import { db } from "@/db";
import { z } from "zod";
import { createBudgetCategoryAllocationWithBudgetCategoryIdSchema } from "../schemas/budgets.shared-schema";

export async function createBudgetCategoryAllocationMutation(
  data: z.infer<typeof createBudgetCategoryAllocationWithBudgetCategoryIdSchema>
) {
  return await db
    .insertInto("budgetCategoryAllocations")
    .values(data)
    .returning(["id"])
    .executeTakeFirstOrThrow();
}
