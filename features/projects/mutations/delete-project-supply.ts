import { db } from "@/db";

export async function deleteProjectSupply(id: string) {
  return await db
    .deleteFrom("projectSupplies")
    .where("id", "=", id)
    .returning(["id"])
    .executeTakeFirstOrThrow();
}
