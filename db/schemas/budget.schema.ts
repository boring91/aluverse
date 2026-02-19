import {
  boolean,
  date,
  integer,
  pgTable,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { auditColumns } from "../utils";

export const budgetCategories = pgTable(
  "budget_categories",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: varchar({ length: 128 }).notNull(),
    humanId: varchar({ length: 32 }).notNull(),
    includingGst: boolean().notNull(),
    ...auditColumns,
  },
  (table) => [uniqueIndex("budget_human_id_index").on(table.humanId)]
);

export const budgetCategoryAllocations = pgTable(
  "budget_category_allocations",
  {
    id: uuid().primaryKey().defaultRandom(),
    budgetCategoryId: uuid()
      .references(() => budgetCategories.id, { onDelete: "cascade" })
      .notNull(),
    amount: integer().notNull(), // in cents
    effectiveDate: date({ mode: "date" }).notNull(),
    ...auditColumns,
  }
);
