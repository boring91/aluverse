import {
  pgTable,
  uuid,
  varchar,
  date,
  text,
  integer,
  AnyPgColumn,
} from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { loanTypes } from "@/lib/constants";
import { consolidations } from "./consolidations.schema";
import { auditColumns } from "../utils";

export const loanType = pgEnum("loan_type", loanTypes);

// Loans
export const loans = pgTable("loans", {
  id: uuid().primaryKey().defaultRandom(),
  type: loanType().notNull(),
  partyName: varchar({ length: 1024 }).notNull(),
  amount: integer().notNull(), // in cents
  date: date({ mode: "date" }).notNull(),
  dueDate: date({ mode: "date" }),
  notes: text(),
  consolidationId: uuid().references((): AnyPgColumn => consolidations.id, {
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
  date: date({ mode: "date" }).notNull(),
  notes: text(),
  consolidationId: uuid().references((): AnyPgColumn => consolidations.id, {
    onDelete: "set null",
  }),
  ...auditColumns,
});
