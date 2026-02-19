import { db } from "@/db";
import { projectListMapper } from "@/shared/mappers/projects/project-list.mapper";

export async function getProjectByIdQuery(id: string) {
  return await db
    .selectFrom("projects")
    .where("id", "=", id)
    .select(projectListMapper)
    .executeTakeFirst();
}
