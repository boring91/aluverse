import { db } from "@/db";
import { roleFullMapper } from "../mappers/role-full.mapper";

export async function getRoleById(id: string) {
  return await db
    .selectFrom("roles")
    .where("roles.id", "=", id)
    .select(roleFullMapper)
    .executeTakeFirst();
}
