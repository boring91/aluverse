import { db } from "@/db";
import { DashboardDateRange } from "../schemas/dashboard.shared-schema";
import { projectsInOutStatsMapper } from "@/shared/mappers/dashboard/projects-in-out-stats.mapper";

export async function getProjectsInOutStatsQuery(input: DashboardDateRange) {
  const { from, to } = input;
  return await db
    .selectFrom("projects")
    .select(projectsInOutStatsMapper(from, to))
    .executeTakeFirstOrThrow();
}
