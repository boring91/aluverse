import { db } from "@/db";
import { projectLaborListMapper } from "@/shared/mappers/projects/project-labor-list.mapper";

export async function getProjectLaborByIdQuery(id: string) {
  return await db
    .selectFrom("projectLabors")
    .where("id", "=", id)
    .select(projectLaborListMapper)
    .executeTakeFirst();
}
