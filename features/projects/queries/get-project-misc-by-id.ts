import { db } from "@/db";
import { projectMiscMapper } from "@/db/mappers";

export async function getProjectMiscById(id: string) {
  return await db
    .selectFrom("projectMisc")
    .where("id", "=", id)
    .select(projectMiscMapper)
    .executeTakeFirst();
}
