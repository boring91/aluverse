import { pgTable, uuid, date, varchar, integer } from "drizzle-orm/pg-core";
import { financialAccounts } from "./financial-accounts.schema";
import { auditColumns } from "../utils";

export const transactions = pgTable("transactions", {
  id: uuid().primaryKey().defaultRandom(),
  accountId: uuid()
    .references(() => financialAccounts.id, {
      onDelete: "cascade",
    })
    .notNull(),
  date: date({ mode: "date" }).notNull(),
  description: varchar({
    length: 1024,
  }).notNull(),
  amount: integer().notNull(), // in cents
  ...auditColumns,
});
