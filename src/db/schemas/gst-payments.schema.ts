import {
  pgTable,
  uuid,
  date,
  doublePrecision,
  integer,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { reconciliations } from "./reconciliations.schema";
import { auditColumns } from "../utils";

export const gstPayments = pgTable("gst_payments", {
  id: uuid().primaryKey().defaultRandom(),
  periodFrom: date({ mode: "date" }).notNull(),
  periodTo: date({ mode: "date" }).notNull(),
  rate: doublePrecision().notNull(),
  amount: integer().notNull(), // in cents
  reconciliationId: uuid().references((): AnyPgColumn => reconciliations.id, {
    onDelete: "set null",
  }),
  ...auditColumns,
});
