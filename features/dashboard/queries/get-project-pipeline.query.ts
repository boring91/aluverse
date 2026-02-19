import { db } from "@/db";
import {
  projectPipelineItemMapper,
  projectPipelineStatsMapper,
} from "@/shared/mappers/dashboard/project-pipeline.mapper";

export async function getProjectPipelineQuery() {
  const stats = await db
    .selectFrom("projects")
    .select(projectPipelineStatsMapper)
    .executeTakeFirstOrThrow();

  const pipeline = await db
    .selectFrom("projects")
    .where((eb) =>
      eb.or([
        eb("startDate", "is", null),
        eb.and([eb("startDate", "is not", null), eb("endDate", "is", null)]),
      ])
    )
    .select(projectPipelineItemMapper())
    .execute();

  return { stats, pipeline };
}
