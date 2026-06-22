import { db } from "@/db";
import { userFullMapper } from "@/shared/mappers/users/user-full.mapper";

export async function getUserByIdQuery(id: string) {
  return await db
    .selectFrom("users")
    .where("users.id", "=", id)
    .select(userFullMapper)
    .executeTakeFirst();
}
