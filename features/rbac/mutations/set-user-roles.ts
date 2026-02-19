import { db } from "@/db";
import { z } from "zod";
import { ownerRoleHumanId, setUserRolesSchema } from "../schemas/rbac.schema";

export async function setUserRoles(data: z.infer<typeof setUserRolesSchema>) {
  const { userId, roleIds } = data;
  const uniqueRoleIds = [...new Set(roleIds)];

  if (uniqueRoleIds.length) {
    const existingRoles = await db
      .selectFrom("roles")
      .where("roles.id", "in", uniqueRoleIds)
      .selectAll("roles")
      .execute();

    if (existingRoles.length !== uniqueRoleIds.length) {
      return { status: "invalid_roles" as const };
    }
  }

  const ownerRole = await db
    .selectFrom("roles")
    .where("roles.humanId", "=", ownerRoleHumanId)
    .selectAll("roles")
    .executeTakeFirst();

  if (ownerRole) {
    const currentlyHasOwnerRole = await db
      .selectFrom("userRoles")
      .where("userRoles.userId", "=", userId)
      .where("userRoles.roleId", "=", ownerRole.id)
      .selectAll("userRoles")
      .limit(1)
      .executeTakeFirst();

    const willHaveOwnerRole = uniqueRoleIds.includes(ownerRole.id);

    if (currentlyHasOwnerRole && !willHaveOwnerRole) {
      const ownerAssignments = await db
        .selectFrom("userRoles")
        .where("userRoles.roleId", "=", ownerRole.id)
        .selectAll("userRoles")
        .execute();

      if (ownerAssignments.length <= 1) {
        return { status: "last_owner" as const };
      }
    }
  }

  if (!uniqueRoleIds.length) {
    await db
      .deleteFrom("userRoles")
      .where("userRoles.userId", "=", userId)
      .execute();
    return { status: "ok" as const };
  }

  await db
    .deleteFrom("userRoles")
    .where("userRoles.userId", "=", userId)
    .where("userRoles.roleId", "not in", uniqueRoleIds)
    .execute();

  await db
    .insertInto("userRoles")
    .values(
      uniqueRoleIds.map((roleId) => ({
        userId,
        roleId,
      }))
    )
    .onConflict((oc) => oc.columns(["userId", "roleId"]).doNothing())
    .execute();

  return { status: "ok" as const };
}
