import { db } from "@/db";
import { DashboardDateRange } from "../schemas/dashboard.shared-schema";
import {
  isProjectWithinRange,
  projectCost,
} from "@/shared/expressions/projects/project.expression";

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
    .select((eb) => [
      "humanId",
      "title",
      "price",
      projectCost(eb).as("projectCost"),
      eb
        .case()
        .when("price", ">", eb.lit(0))
        .then(
          eb(
            eb.parens(eb("price", "-", projectCost(eb))),
            "/",
            eb.cast<number>(eb.ref("price"), "double precision")
          )
        )
        .else(eb.lit(0))
        .end()
        .as("profitMargin"),
    ])
    .orderBy("profitMargin", "desc")
    .execute();

  return projects.map((project) => ({
    name: project.humanId || project.title,
    profit: Number(project.profitMargin ?? 0),
  }));
}
