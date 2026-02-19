import { db } from "@/db";
import { z } from "zod";
import { roleFullMapper } from "../mappers/role-full.mapper";
import { updateRoleSchema } from "../schemas/rbac.schema";

export async function updateRole(data: z.infer<typeof updateRoleSchema>) {
  const { id, permissions, ...values } = data;

  const updatedRole = await db
    .updateTable("roles")
    .set(values)
    .where("roles.id", "=", id)
    .returningAll()
    .executeTakeFirst();

  if (!updatedRole) {
    return null;
  }

  await db
    .deleteFrom("rolePermissions")
    .where("rolePermissions.roleId", "=", id)
    .execute();

  const uniquePermissions = [...new Set(permissions)];

  await db
    .insertInto("rolePermissions")
    .values(
      uniquePermissions.map((permission) => ({
        roleId: id,
        permission,
      }))
    )
    .onConflict((oc) => oc.columns(["roleId", "permission"]).doNothing())
    .execute();

  return await db
    .selectFrom("roles")
    .where("roles.id", "=", id)
    .select(roleFullMapper)
    .executeTakeFirstOrThrow();
}
