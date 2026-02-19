import { DB } from "@/db/types";
import { jsonArrayFrom } from "@/db/json-helpers";
import { ExpressionBuilder, SelectExpression } from "kysely";

export const roleListMapper = (eb: ExpressionBuilder<DB, "roles">) =>
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

export const roleCountMapper = (eb: ExpressionBuilder<DB, "roles">) =>
  [eb.fn.count<number>("roles.id").as("count")] satisfies SelectExpression<
    DB,
    "roles"
  >[];
