import { db } from "@/db";

export async function deleteProject(id: string) {
  return await db
    .deleteFrom("projects")
    .where("id", "=", id)
    .returning(["id"])
    .executeTakeFirstOrThrow();
}
