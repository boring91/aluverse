import { DB } from "@/db/types";
import { jsonArrayFrom } from "@/db/json-helpers";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const roleFullMapper = (eb: ExpressionBuilder<DB, "roles">) =>
  [
    "roles.id",
    "roles.humanId",
    "roles.name",
    "roles.description",
    "roles.isBuiltIn",
    "roles.createdAt",
    "roles.updatedAt",
    jsonArrayFrom(
      eb
        .selectFrom("rolePermissions")
        .whereRef("rolePermissions.roleId", "=", "roles.id")
        .orderBy("rolePermissions.permission", "asc")
        .select(["rolePermissions.permission"])
    ).as("permissions"),
  ] satisfies SelectExpression<DB, "roles">[];
