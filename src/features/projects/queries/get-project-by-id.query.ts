import { db } from "@/db";
import { projectFullMapper } from "@/shared/mappers/projects/project-full.mapper";

export async function getProjectByIdQuery(id: string) {
  return await db
    .selectFrom("projects")
    .where("id", "=", id)
    .select(projectFullMapper)
    .executeTakeFirst();
}
