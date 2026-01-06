import { db } from "@/db";
import { isProjectWithinRange, projectMargin } from "@/db/expressions";
import { projectMapper } from "@/db/mappers";

export async function getTopAndWorstPerformers(from?: Date, to?: Date) {
  const query = db
    .selectFrom("projects")
    .where((eb) =>
      eb.and([
        isProjectWithinRange(eb, from, to),
        eb(projectMargin(eb), "is not", null),
      ])
    );

  return {
    top: await query
      .select(projectMapper)
      .orderBy(projectMargin, "desc")
      .limit(5)
      .execute(),
    bottom: await query
      .select(projectMapper)
      .orderBy(projectMargin, "asc")
      .limit(5)
      .execute(),
  };
}
