import { db } from "@/db";
import { z } from "zod";
import { updateBudgetCategoryAllocationSchema } from "../schemas/budgets.shared-schema";

export async function updateBudgetCategoryAllocationMutation(
  data: z.infer<typeof updateBudgetCategoryAllocationSchema>
) {
  const { id, ...values } = data;

  return await db
    .updateTable("budgetCategoryAllocations")
    .set(values)
    .where("id", "=", id)
    .returning(["id"])
    .executeTakeFirstOrThrow();
}
