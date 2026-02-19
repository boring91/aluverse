import { db } from "@/db";
import { projectMiscListMapper } from "@/shared/mappers/projects/project-misc-list.mapper";

export async function getProjectMiscByIdQuery(id: string) {
  return await db
    .selectFrom("projectMisc")
    .where("id", "=", id)
    .select(projectMiscListMapper)
    .executeTakeFirst();
}
