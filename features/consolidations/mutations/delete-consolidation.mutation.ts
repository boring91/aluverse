import { db } from "@/db";

export async function deleteConsolidationMutation(id: string) {
  return await db
    .deleteFrom("consolidations")
    .where("id", "=", id)
    .returning(["id"])
    .executeTakeFirstOrThrow();
}
