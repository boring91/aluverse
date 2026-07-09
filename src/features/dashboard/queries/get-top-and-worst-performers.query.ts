import { db } from "@/db";
import {
  isProjectWithinRange,
  projectMargin,
} from "@/shared/expressions/projects/project.expression";
import { projectListMapper } from "@/shared/mappers/projects/project-list.mapper";

export async function getTopAndWorstPerformersQuery(
  from?: string,
  to?: string,
) {
  const query = db
    .selectFrom("projects")
    .where((eb) =>
      eb.and([
        isProjectWithinRange(eb, from, to),
        eb(projectMargin(eb), "is not", null),
      ]),
    );

  return {
    top: await query
      .select(projectListMapper)
      .orderBy(projectMargin, "desc")
      .limit(5)
      .execute(),
    bottom: await query
      .select(projectListMapper)
      .orderBy(projectMargin, "asc")
      .limit(5)
      .execute(),
  };
}
