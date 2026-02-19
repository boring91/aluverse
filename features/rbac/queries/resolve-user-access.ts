import { db } from "@/db";
import {
  ownerRoleHumanId,
  ownerRoleName,
  permissions,
  type Permission,
} from "../schemas/rbac.schema";

const permissionSet = new Set<string>(permissions);

const isPermission = (value: string): value is Permission => {
  return permissionSet.has(value);
};

async function ensureOwnerRole() {
  const existingOwnerRole = await db
    .selectFrom("roles")
    .where("roles.humanId", "=", ownerRoleHumanId)
    .selectAll("roles")
    .executeTakeFirst();

  if (!existingOwnerRole) {
    await db
      .insertInto("roles")
      .values({
        humanId: ownerRoleHumanId,
        name: ownerRoleName,
        description: "Built-in role with full access.",
        isBuiltIn: true,
      })
      .onConflict((oc) => oc.columns(["humanId"]).doNothing())
      .execute();
  }

  const ownerRole = await db
    .selectFrom("roles")
    .where("roles.humanId", "=", ownerRoleHumanId)
    .selectAll("roles")
    .executeTakeFirstOrThrow();

  const existingPermissions = await db
    .selectFrom("rolePermissions")
    .where("rolePermissions.roleId", "=", ownerRole.id)
    .selectAll("rolePermissions")
    .execute();

  const existingPermissionSet = new Set(
    existingPermissions.map((item) => item.permission)
  );

  const missingPermissions = permissions.filter(
    (permission) => !existingPermissionSet.has(permission)
  );

  if (missingPermissions.length) {
    await db
      .insertInto("rolePermissions")
      .values(
        missingPermissions.map((permission) => ({
          roleId: ownerRole.id,
          permission,
        }))
      )
      .onConflict((oc) => oc.columns(["roleId", "permission"]).doNothing())
      .execute();
  }

  return ownerRole;
}

async function bootstrapOwnerAssignment(userId: string, ownerRoleId: string) {
  const hasUserRole = await db
    .selectFrom("userRoles")
    .where("userRoles.userId", "=", userId)
    .selectAll("userRoles")
    .limit(1)
    .executeTakeFirst();

  if (hasUserRole) {
    return;
  }

  const hasAnyAssignment = await db
    .selectFrom("userRoles")
    .selectAll("userRoles")
    .limit(1)
    .executeTakeFirst();

  if (hasAnyAssignment) {
    return;
  }

  await db
    .insertInto("userRoles")
    .values({
      userId,
      roleId: ownerRoleId,
    })
    .onConflict((oc) => oc.columns(["userId", "roleId"]).doNothing())
    .execute();
}

export async function resolveUserAccess(userId: string) {
  const ownerRole = await ensureOwnerRole();
  await bootstrapOwnerAssignment(userId, ownerRole.id);

  const roleRows = await db
    .selectFrom("userRoles")
    .innerJoin("roles", "roles.id", "userRoles.roleId")
    .where("userRoles.userId", "=", userId)
    .orderBy("roles.name", "asc")
    .selectAll("roles")
    .execute();

  const permissionRows = await db
    .selectFrom("userRoles")
    .innerJoin("rolePermissions", "rolePermissions.roleId", "userRoles.roleId")
    .where("userRoles.userId", "=", userId)
    .selectAll("rolePermissions")
    .execute();

  const resolvedPermissions = [
    ...new Set(
      permissionRows
        .map((row) => row.permission)
        .filter((permission) => isPermission(permission))
    ),
  ];

  return {
    permissions: resolvedPermissions,
    roles: roleRows.map((role) => ({
      id: role.id,
      humanId: role.humanId,
      name: role.name,
      isBuiltIn: role.isBuiltIn,
    })),
  } as const;
}
