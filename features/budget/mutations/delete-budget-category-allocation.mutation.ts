import { db } from "@/db";

export async function deleteBudgetCategoryAllocationMutation(id: string) {
  return await db
    .deleteFrom("budgetCategoryAllocations")
    .where("id", "=", id)
    .returning(["id"])
    .executeTakeFirstOrThrow();
}
