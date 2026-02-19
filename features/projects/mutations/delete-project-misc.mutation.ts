import { db } from "@/db";

export async function deleteProjectMiscMutation(id: string) {
  return await db.transaction().execute(async (tx) => {
    const misc = await db
      .deleteFrom("projectMisc")
      .where("id", "=", id)
      .returning(["id", "consolidationId"])
      .executeTakeFirstOrThrow();

    if (!misc.consolidationId) return misc;

    await tx
      .deleteFrom("consolidations")
      .where("id", "=", misc.consolidationId)
      .execute();

    return misc;
  });
}
