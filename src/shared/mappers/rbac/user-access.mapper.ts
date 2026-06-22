import type { DB } from "@/db/types";
import { jsonArrayFrom } from "@/db/json-helpers";
import type { ExpressionBuilder, SelectExpression } from "kysely";

export const userAccessMapper = (eb: ExpressionBuilder<DB, "users">) =>
  [
    "users.id",
    "users.name",
    "users.email",
    jsonArrayFrom(
      eb
        .selectFrom("userRoles")
        .innerJoin("roles", "roles.id", "userRoles.roleId")
        .whereRef("userRoles.userId", "=", "users.id")
        .orderBy("roles.name", "asc")
        .select([
          "roles.id",
          "roles.humanId",
          "roles.name",
          "roles.description",
          "roles.isBuiltIn",
        ]),
    ).as("roles"),
  ] satisfies SelectExpression<DB, "users">[];
