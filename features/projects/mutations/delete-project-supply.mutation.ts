import { db } from "@/db";

export async function deleteProjectSupplyMutation(id: string) {
  return await db.transaction().execute(async (tx) => {
    const supply = await db
      .deleteFrom("projectSupplies")
      .where("id", "=", id)
      .returning(["id", "reconciliationId"])
      .executeTakeFirstOrThrow();

    if (!supply.reconciliationId) return supply;

    await tx
      .deleteFrom("reconciliations")
      .where("id", "=", supply.reconciliationId)
      .execute();

    return supply;
  });
}
