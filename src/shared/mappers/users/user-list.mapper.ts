import type { DB } from "@/db/types";
import type { SelectExpression } from "kysely";

export const userListMapper = () =>
  [
    "users.id",
    "users.name",
    "users.email",
    "users.emailVerified",
    "users.createdAt",
    "users.updatedAt",
  ] satisfies SelectExpression<DB, "users">[];
