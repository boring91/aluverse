import {
  boolean,
  date,
  integer,
  pgTable,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { auditColumns } from "../utils";

export const budgetCategories = pgTable("budget_categories", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 128 }).notNull(),
  includingGst: boolean().notNull(),
  ...auditColumns,
});

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
  },
);
