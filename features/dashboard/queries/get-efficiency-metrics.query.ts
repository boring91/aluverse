import { db } from "@/db";
import { isProjectWithinRange } from "@/shared/expressions/projects/project.expression";
import { efficiencyMetricsMapper } from "@/shared/mappers/dashboard/efficiency-metrics.mapper";

export async function getEfficiencyMetricsQuery(from?: Date, to?: Date) {
  return await db
    .selectFrom("projects")
    .where((eb) => isProjectWithinRange(eb, from, to))
    .select(efficiencyMetricsMapper)
    .executeTakeFirstOrThrow();
}
