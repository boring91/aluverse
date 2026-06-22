import { db } from "@/db";

export async function deleteProjectLaborMutation(id: string) {
  return await db.transaction().execute(async (tx) => {
    const labor = await db
      .deleteFrom("projectLabors")
      .where("id", "=", id)
      .returning(["id", "reconciliationId"])
      .executeTakeFirstOrThrow();

    if (!labor.reconciliationId) return labor;

    await tx
      .deleteFrom("reconciliations")
      .where("id", "=", labor.reconciliationId)
      .execute();

    return labor;
  });
}
