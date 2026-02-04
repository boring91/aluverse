import {
  pgTable,
  uuid,
  date,
  varchar,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { financialAccounts } from "./financial-accounts";

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
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
