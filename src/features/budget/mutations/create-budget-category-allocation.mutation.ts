import type { z } from "zod";
import { db } from "@/db";
import type { createBudgetCategoryAllocationWithBudgetCategoryIdSchema } from "../schemas/budgets.shared-schema";

export async function createBudgetCategoryAllocationMutation(
  data: z.infer<
    typeof createBudgetCategoryAllocationWithBudgetCategoryIdSchema
  >,
) {
  return await db
    .insertInto("budgetCategoryAllocations")
    .values(data)
    .returning(["id"])
    .executeTakeFirstOrThrow();
}
