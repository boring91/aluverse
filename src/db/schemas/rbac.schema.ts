import {
  boolean,
  index,
  pgTable,
  text,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./auth.schema";
import { auditColumns } from "../utils";

export const roles = pgTable(
  "roles",
  {
    id: uuid().primaryKey().defaultRandom(),
    humanId: varchar({ length: 128 }),
    name: varchar({ length: 256 }).notNull(),
    description: text(),
    isBuiltIn: boolean().notNull().default(false),
    ...auditColumns,
  },
  (t) => [unique().on(t.humanId)],
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid().primaryKey().defaultRandom(),
    roleId: uuid()
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permission: varchar({ length: 128 }).notNull(),
    ...auditColumns,
  },
  (t) => [unique().on(t.roleId, t.permission), index().on(t.permission)],
);

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid()
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    ...auditColumns,
  },
  (t) => [
    unique().on(t.userId, t.roleId),
    index().on(t.userId),
    index().on(t.roleId),
  ],
);
