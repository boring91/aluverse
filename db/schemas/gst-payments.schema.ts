import {
  pgTable,
  uuid,
  date,
  doublePrecision,
  integer,
} from "drizzle-orm/pg-core";
import { auditColumns } from "../utils";

export const gstPayments = pgTable("gst_payments", {
  id: uuid().primaryKey().defaultRandom(),
  periodFrom: date({ mode: "date" }).notNull(),
  periodTo: date({ mode: "date" }).notNull(),
  rate: doublePrecision().notNull(),
  amount: integer().notNull(), // in cents
  ...auditColumns,
});
