import { z } from "zod";
import { db } from "@/db";
import { projectListMapper } from "@/shared/mappers/projects/project-list.mapper";
import { createProjectSchema } from "../schemas/projects.shared-schema";
import { getBudgetUnitValueQuery } from "../queries/get-budget-unit-value.query";

export async function createProjectMutation(
  data: z.infer<typeof createProjectSchema>
) {
  // Compute a new human id in this format PXXXX:
  const { count } = await db
    .selectFrom("projects")
    .select(db.fn.count<number>("id").as("count"))
    .executeTakeFirstOrThrow();

  const humanId = "P" + `${count + 1}`.padStart(4, "0");

  return await db
    .insertInto("projects")
    .values({
      ...data,
      budgetUnitValue: await getBudgetUnitValueQuery(),
      humanId,
    })
    .returning(projectListMapper)
    .executeTakeFirstOrThrow();
}
