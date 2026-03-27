import { db } from "@/db";
import {
  isProjectWithinRange,
  projectAllocationOverrun,
  projectDaysOverdue,
  projectProfit,
} from "@/shared/expressions/projects/project.expression";
import { projectListMapper } from "@/shared/mappers/projects/project-list.mapper";

export async function getProjectsWithAlertsQuery(from?: Date, to?: Date) {
  let query = db.selectFrom("projects");

  query = query.where((eb) => isProjectWithinRange(eb, from, to));

  return query
    .where((eb) =>
      eb.or([
        eb(projectProfit, "<", eb.lit(0)),
        eb(projectDaysOverdue, ">", 1),
        eb(projectAllocationOverrun, ">", 0),
      ])
    )
    .select(projectListMapper)
    .orderBy((eb) =>
      eb
        .case()
        .when(projectProfit, "<", eb.lit(0))
        .then(0)
        .when(eb(projectDaysOverdue, ">", 0))
        .then(1)
        .else(2)
        .end()
    )
    .execute();
}
