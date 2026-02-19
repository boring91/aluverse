import { db } from "@/db";
import { budgetCategoryListMapper } from "@/shared/mappers/budget/budget-category-list.mapper";
import { TRPCError } from "@trpc/server";

export async function deleteBudgetCategoryMutation(id: string) {
  const inUse = await db
    .selectFrom("consolidations")
    .where("budgetCategoryId", "=", id)
    .select((eb) => eb.fn.count<number>("id").as("count"))
    .executeTakeFirstOrThrow();

  if (inUse.count > 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "BUDGET_CATEGORY_IN_USE",
    });
  }

  return await db
    .deleteFrom("budgetCategories")
    .where("id", "=", id)
    .returning(budgetCategoryListMapper)
    .executeTakeFirstOrThrow();
}
