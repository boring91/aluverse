import { db } from "@/db";
import { roleFullMapper } from "@/shared/mappers/rbac/role-full.mapper";

export async function getRoleByIdQuery(id: string) {
  return await db
    .selectFrom("roles")
    .where("roles.id", "=", id)
    .select(roleFullMapper)
    .executeTakeFirst();
}
