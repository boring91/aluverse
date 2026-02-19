import { db } from "@/db";

export async function deleteProjectMiscMutation(id: string) {
  return await db.transaction().execute(async (tx) => {
    const misc = await db
      .deleteFrom("projectMisc")
      .where("id", "=", id)
      .returning(["id", "reconciliationId"])
      .executeTakeFirstOrThrow();

    if (!misc.reconciliationId) return misc;

    await tx
      .deleteFrom("reconciliations")
      .where("id", "=", misc.reconciliationId)
      .execute();

    return misc;
  });
}
