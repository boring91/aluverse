import { db } from "@/db";
import {
  projectCompleted,
  projectPaid,
  projectCost,
  isProjectWithinRange,
} from "@/db/expressions";

export async function getEfficiencyMetrics(from?: Date, to?: Date) {
  return await db
    .selectFrom("projects")
    .where((eb) => isProjectWithinRange(eb, from, to))
    .select((eb) => [
      eb.fn.avg<number>(projectPaid(eb)).as("revenuePerProject"),
      eb.fn.avg<number>(projectCost(eb)).as("costPerProject"),
      eb.fn.avg<number>("price").as("valuePerProject"),
      eb.fn
        .sum<number>(eb.case().when(projectCompleted(eb)).then(1).else(0).end())
        .as("completedCount"),
      eb.fn.count<number>("id").as("projectCount"),
    ])
    .executeTakeFirstOrThrow();
}
