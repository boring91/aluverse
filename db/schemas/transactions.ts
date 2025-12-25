import { pgTable, uuid, date, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { transactionTypes } from "@/lib/constants";
import { financialAccounts } from "./financial-accounts";

export const transactionType = pgEnum("transaction_type", transactionTypes);

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
    type: transactionType().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

