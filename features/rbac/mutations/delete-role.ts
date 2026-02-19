import { db } from "@/db";

export async function deleteRole(id: string) {
  const deleted = await db
    .deleteFrom("roles")
    .where("roles.id", "=", id)
    .returningAll()
    .executeTakeFirst();

  return !!deleted;
}
