import { db } from "@/db";
import { projectMapper } from "@/db/mappers";

export async function getProjectById(id: string) {
  return await db
    .selectFrom("projects")
    .where("id", "=", id)
    .select(projectMapper)
    .executeTakeFirst();
}
