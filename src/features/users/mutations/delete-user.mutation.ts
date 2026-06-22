import { db } from "@/db";

export async function deleteUserMutation(id: string) {
  const result = await db
    .deleteFrom("users")
    .where("users.id", "=", id)
    .executeTakeFirst();

  return result.numDeletedRows > 0;
}
