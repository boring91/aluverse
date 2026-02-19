import { banks } from "@/features/financial-accounts/lib/bank-syncer/constants";
import { pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { auditColumns } from "../utils";

export const financialAccountBankSyncers = pgEnum(
  "financial_account_bank_syncers",
  banks
);

export const financialAccounts = pgTable("financial_accounts", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  syncWithBank: financialAccountBankSyncers(),
  ...auditColumns,
});
