import { db } from "@/db";

export async function deleteReconciliationMutation(id: string) {
  return await db
    .deleteFrom("reconciliations")
    .where("id", "=", id)
    .returning(["id"])
    .executeTakeFirstOrThrow();
}
