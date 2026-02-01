import { getCurrentTime } from "@/lib/utils";
import {
  date,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const budgetCategories = pgTable(
  "budget_categories",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: varchar({ length: 128 }).notNull(),
    humanId: varchar({ length: 32 }).notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => getCurrentTime()),
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
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => getCurrentTime()),
  }
);
