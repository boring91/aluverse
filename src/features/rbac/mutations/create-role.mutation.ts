import type { z } from "zod";
import { db } from "@/db";
import { roleFullMapper } from "@/shared/mappers/rbac/role-full.mapper";
import type { createRoleSchema } from "../schemas/rbac.shared-schema";

export async function createRoleMutation(
  data: z.infer<typeof createRoleSchema>,
) {
  const uniquePermissions = [...new Set(data.permissions)];

  const { id } = await db
    .insertInto("roles")
    .values({
      name: data.name,
      description: data.description,
      isBuiltIn: false,
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  await db
    .insertInto("rolePermissions")
    .values(
      uniquePermissions.map((permission) => ({
        roleId: id,
        permission,
      })),
    )
    .onConflict((oc) => oc.columns(["roleId", "permission"]).doNothing())
    .execute();

  return await db
    .selectFrom("roles")
    .where("roles.id", "=", id)
    .select(roleFullMapper)
    .executeTakeFirstOrThrow();
}
