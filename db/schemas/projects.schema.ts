import {
  pgTable,
  uuid,
  varchar,
  date,
  text,
  doublePrecision,
  integer,
} from "drizzle-orm/pg-core";
import { consolidations } from "./consolidations.schema";
import { auditColumns } from "../utils";

// Projects
export const projects = pgTable("projects", {
  id: uuid().primaryKey().defaultRandom(),
  humanId: varchar({ length: 32 }).notNull(),
  client: varchar({ length: 1024 }).notNull(),
  title: varchar({ length: 1024 }).notNull(),
  visitDate: date({ mode: "date" }),
  startDate: date({ mode: "date" }),
  endDate: date({ mode: "date" }),
  address: text(),
  meters: doublePrecision(),
  price: integer().notNull(),
  margin: doublePrecision().notNull(),
  budgetUnits: doublePrecision().notNull(),
  budgetUnitValue: integer().notNull(),
  ...auditColumns,
});

export const projectSupplies = pgTable("project_supplies", {
  id: uuid().primaryKey().defaultRandom(),
  projectId: uuid()
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar({ length: 1024 }).notNull(),
  quantity: integer().notNull(),
  unitPrice: integer().notNull(), // in cents
  consolidationId: uuid().references(() => consolidations.id, {
    onDelete: "set null",
  }),
  ...auditColumns,
});

export const projectLabors = pgTable("project_labors", {
  id: uuid().primaryKey().defaultRandom(),
  projectId: uuid()
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar({ length: 1024 }).notNull(),
  hours: integer().notNull(),
  rate: integer().notNull(), // in cents per hour
  consolidationId: uuid().references(() => consolidations.id, {
    onDelete: "set null",
  }),
  ...auditColumns,
});

export const projectMisc = pgTable("project_misc", {
  id: uuid().primaryKey().defaultRandom(),
  projectId: uuid()
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar({ length: 1024 }).notNull(),
  amount: integer().notNull(), // in cents
  consolidationId: uuid().references(() => consolidations.id, {
    onDelete: "set null",
  }),
  ...auditColumns,
});

export const projectPayments = pgTable("project_payments", {
  id: uuid().primaryKey().defaultRandom(),
  projectId: uuid()
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  amount: integer().notNull(), // in cents
  date: date({ mode: "date" }).notNull(),
  consolidationId: uuid().references(() => consolidations.id, {
    onDelete: "set null",
  }),
  ...auditColumns,
});
