import { db } from "@/db";
import { DashboardDateRange } from "../schemas/dashboard.schema";
import { projectCost } from "@/db/expressions/projects.expression";

export async function getProjectProfitStats(input: DashboardDateRange) {
  const { from, to } = input;

  // Get projects that have activity in the date range
  let projectsQuery = db.selectFrom("projects");

  // Filter by date range - projects that started or ended in the range
  if (from && to) {
    projectsQuery = projectsQuery.where((eb) =>
      eb.or([
        eb.and([
          eb("startDate", "is not", null),
          eb("startDate", ">=", from),
          eb("startDate", "<=", to),
        ]),
        eb.and([
          eb("endDate", "is not", null),
          eb("endDate", ">=", from),
          eb("endDate", "<=", to),
        ]),
        eb.and([
          eb("startDate", "<=", to),
          eb.or([eb("endDate", "is", null), eb("endDate", ">=", from)]),
        ]),
      ])
    );
  }

  const projects = await projectsQuery
    .select((eb) => [
      "humanId",
      "title",
      "price",
      projectCost(eb).as("projectCost"),
      // Calculate profit margin in the database: ((price - cost) / price) * 100
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
