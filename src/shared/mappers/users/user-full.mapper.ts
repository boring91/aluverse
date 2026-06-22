import type { DB } from "@/db/types";
import type { SelectExpression } from "kysely";

export const userFullMapper = () =>
  [
    "users.id",
    "users.name",
    "users.email",
    "users.emailVerified",
    "users.image",
    "users.createdAt",
    "users.updatedAt",
  ] satisfies SelectExpression<DB, "users">[];
