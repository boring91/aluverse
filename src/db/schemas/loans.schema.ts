import {
  pgTable,
  uuid,
  varchar,
  date,
  text,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { loanTypes } from "@/lib/constants";
import { reconciliations } from "./reconciliations.schema";
import { auditColumns } from "../utils";

export const loanType = pgEnum("loan_type", loanTypes);

// Loans
export const loans = pgTable("loans", {
  id: uuid().primaryKey().defaultRandom(),
  type: loanType().notNull(),
  partyName: varchar({ length: 1024 }).notNull(),
  amount: integer().notNull(), // in cents
  date: date({ mode: "string" }).notNull(),
  dueDate: date({ mode: "string" }),
  notes: text(),
  reconciliationId: uuid().references((): AnyPgColumn => reconciliations.id, {
    onDelete: "set null",
  }),
  ...auditColumns,
});

export const loanPayoffs = pgTable("loan_payoffs", {
  id: uuid().primaryKey().defaultRandom(),
  loanId: uuid()
    .references(() => loans.id, { onDelete: "cascade" })
    .notNull(),
  amount: integer().notNull(), // in cents
  date: date({ mode: "string" }).notNull(),
  notes: text(),
  reconciliationId: uuid().references((): AnyPgColumn => reconciliations.id, {
    onDelete: "set null",
  }),
  ...auditColumns,
});
