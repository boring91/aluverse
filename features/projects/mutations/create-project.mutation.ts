import { z } from "zod";
import { db } from "@/db";
import { projectListMapper } from "@/shared/mappers/projects/project-list.mapper";
import { createProjectSchema } from "../schemas/projects.shared-schema";
import { getEffectiveBudgetCategoryAllocationsByDateQuery } from "@/features/budget/queries/get-effective-budget-category-allocations.query";
import { BUDGET_UNITS_PER_MONTH } from "@/lib/constants";
import { getCurrentTime } from "@/lib/utils";

export async function createProjectMutation(
  data: z.infer<typeof createProjectSchema>
) {
  // Compute a new human id in this format PXXXX:
  const { count } = await db
    .selectFrom("projects")
    .select(db.fn.count<number>("id").as("count"))
    .executeTakeFirstOrThrow();

  const allocations =
    await getEffectiveBudgetCategoryAllocationsByDateQuery(getCurrentTime());
  const budgetUnitValue = Math.ceil(
    allocations.reduce((sum, allocation) => sum + allocation.monthlyAmount, 0) /
      BUDGET_UNITS_PER_MONTH
  );

  const humanId = "P" + `${count + 1}`.padStart(4, "0");

  return await db
    .insertInto("projects")
    .values({ ...data, budgetUnitValue, humanId })
    .returning(projectListMapper)
    .executeTakeFirstOrThrow();
}
