import { db } from "@/db";

export async function deleteConsolidation(id: string) {
  return await db
    .deleteFrom("consolidations")
    .where("id", "=", id)
    .returning(["id"])
    .executeTakeFirstOrThrow();
}
