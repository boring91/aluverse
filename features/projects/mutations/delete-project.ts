import { db } from "@/db";

export async function deleteProject(id: string) {
  // Delete project item consolidations
  return await db.transaction().execute(async (tx) => {
    await tx.deleteFrom("consolidations").where("projectId", "=", id).execute();

    return await tx
      .deleteFrom("projects")
      .where("id", "=", id)
      .returning(["id"])
      .executeTakeFirstOrThrow();
  });
}
