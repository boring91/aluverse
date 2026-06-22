import { db } from "@/db";
import type { DashboardDateRange } from "../schemas/dashboard.shared-schema";
import {
  isProjectWithinRange,
  projectCost,
  projectMargin,
} from "@/shared/expressions/projects/project.expression";

export async function getProjectProfitStatsQuery(input: DashboardDateRange) {
  const { from, to } = input;

  // Get projects that have activity in the date range
  let projectsQuery = db.selectFrom("projects");

  // Filter by date range - projects that started or ended in the range
  if (from && to) {
    projectsQuery = projectsQuery.where((eb) =>
      isProjectWithinRange(eb, from, to),
    );
  }

  const projects = await projectsQuery
    .select((eb) => [
      "humanId",
      "title",
      "price",
      projectCost(eb).as("projectCost"),
      projectMargin(eb).as("profitMargin"),
    ])
    .orderBy("profitMargin", "desc")
    .execute();

  return projects.map((project) => ({
    name: project.humanId || project.title,
    profit: project.profitMargin ?? 0,
  }));
}
