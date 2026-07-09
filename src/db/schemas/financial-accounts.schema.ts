import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { auditColumns } from "../utils";

export const financialAccounts = pgTable("financial_accounts", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  frolloAccountId: text(),
  ...auditColumns,
});
