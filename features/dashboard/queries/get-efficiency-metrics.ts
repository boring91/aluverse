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
      eb.fn
        .coalesce(eb.fn.avg<number>(projectPaid(eb)), eb.lit(0))
        .as("revenuePerProject"),
      eb.fn
        .coalesce(eb.fn.avg<number>(projectCost(eb)), eb.lit(0))
        .as("costPerProject"),
      eb.fn
        .coalesce(eb.fn.avg<number>("price"), eb.lit(0))
        .as("valuePerProject"),
      eb.fn
        .coalesce(
          eb.fn.sum<number>(
            eb.case().when(projectCompleted(eb)).then(1).else(0).end()
          ),
          eb.lit(0)
        )
        .as("completedCount"),
      eb.fn.count<number>("id").as("projectCount"),
    ])
    .executeTakeFirstOrThrow();
}
