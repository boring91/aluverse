import { DB } from "@/db/types";
import { SelectExpression } from "kysely";

export const userListMapper = () =>
  [
    "users.id",
    "users.name",
    "users.email",
    "users.emailVerified",
    "users.createdAt",
    "users.updatedAt",
  ] satisfies SelectExpression<DB, "users">[];
