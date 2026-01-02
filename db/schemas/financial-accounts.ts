import { banks } from "@/features/financial-accounts/lib/bank-syncer/constants";
import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const financialAccountBankSyncers = pgEnum(
  "financial_account_bank_syncers",
  banks
);

export const financialAccounts = pgTable("financial_accounts", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  syncWithBank: financialAccountBankSyncers(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
