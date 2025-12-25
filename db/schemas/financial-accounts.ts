import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Financial accounts:
export const financialAccounts = pgTable("financial_accounts", {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

