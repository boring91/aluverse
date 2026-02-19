import { db } from "@/db";

export async function deleteProjectLaborMutation(id: string) {
  return await db.transaction().execute(async (tx) => {
    const labor = await db
      .deleteFrom("projectLabors")
      .where("id", "=", id)
      .returning(["id", "consolidationId"])
      .executeTakeFirstOrThrow();

    if (!labor.consolidationId) return labor;

    await tx
      .deleteFrom("consolidations")
      .where("id", "=", labor.consolidationId)
      .execute();

    return labor;
  });
}
