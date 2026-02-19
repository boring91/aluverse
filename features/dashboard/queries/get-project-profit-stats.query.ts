import { db } from "@/db";
import { DashboardDateRange } from "../schemas/dashboard.shared-schema";
import { isProjectWithinRange } from "@/shared/expressions/projects/project.expression";
import { projectProfitStatsMapper } from "@/shared/mappers/dashboard/project-profit-stats.mapper";

export async function getProjectProfitStatsQuery(input: DashboardDateRange) {
  const { from, to } = input;

  // Get projects that have activity in the date range
  let projectsQuery = db.selectFrom("projects");

  // Filter by date range - projects that started or ended in the range
  if (from && to) {
    projectsQuery = projectsQuery.where((eb) =>
      isProjectWithinRange(eb, from, to)
    );
  }

  const projects = await projectsQuery
    .select(projectProfitStatsMapper)
    .orderBy("profitMargin", "desc")
    .execute();

  return projects.map((project) => ({
    name: project.humanId || project.title,
    profit: Number(project.profitMargin ?? 0),
  }));
}
