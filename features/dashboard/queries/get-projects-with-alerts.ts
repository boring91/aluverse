import { db } from "@/db";
import {
  isProjectWithinRange,
  projectAllocationOverrun,
  projectCost,
  projectDaysOverdue,
} from "@/db/expressions";
import { projectMapper } from "@/db/mappers";

export async function getProjectsWithAlerts(from?: Date, to?: Date) {
  let query = db.selectFrom("projects");

  query = query.where((eb) => isProjectWithinRange(eb, from, to));

  return query
    .where((eb) =>
      eb.or([
        eb(projectCost, ">", eb.ref("price")),
        eb(projectDaysOverdue, ">", 1),
        eb(projectAllocationOverrun, ">", 0),
      ])
    )
    .select(projectMapper)
    .orderBy((eb) =>
      eb
        .case()
        .when(projectCost, ">", eb.ref("price"))
        .then(0)
        .when(eb(projectDaysOverdue, ">", 0))
        .then(1)
        .else(2)
        .end()
    )
    .execute();
}
