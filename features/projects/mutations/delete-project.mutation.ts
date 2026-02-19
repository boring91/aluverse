import { db } from "@/db";

export async function deleteProjectMutation(id: string) {
  // Delete project item reconciliations
  return await db.transaction().execute(async (tx) => {
    await tx
      .deleteFrom("reconciliations")
      .where("projectId", "=", id)
      .execute();

    return await tx
      .deleteFrom("projects")
      .where("id", "=", id)
      .returning(["id"])
      .executeTakeFirstOrThrow();
  });
}
