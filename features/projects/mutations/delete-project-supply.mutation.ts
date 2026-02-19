import { db } from "@/db";

export async function deleteProjectSupplyMutation(id: string) {
  return await db.transaction().execute(async (tx) => {
    const supply = await db
      .deleteFrom("projectSupplies")
      .where("id", "=", id)
      .returning(["id", "consolidationId"])
      .executeTakeFirstOrThrow();

    if (!supply.consolidationId) return supply;

    await tx
      .deleteFrom("consolidations")
      .where("id", "=", supply.consolidationId)
      .execute();

    return supply;
  });
}
