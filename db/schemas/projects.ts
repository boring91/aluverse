import { pgTable, uuid, varchar, date, text, doublePrecision, integer, timestamp } from "drizzle-orm/pg-core";

// Projects
export const projects = pgTable("projects", {
    id: uuid().primaryKey().defaultRandom(),
    humanId: varchar({ length: 32 }).notNull(),
    client: varchar({ length: 1024 }).notNull(),
    title: varchar({ length: 1024 }).notNull(),
    visitDate: date({ mode: "date" }),
    startDate: date({ mode: "date" }),
    endDate: date({ mode: "date" }),
    address: text(),
    meters: doublePrecision(),
    price: integer().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export const projectSupplies = pgTable("project_supplies", {
    id: uuid().primaryKey().defaultRandom(),
    projectId: uuid()
        .references(() => projects.id, { onDelete: "cascade" })
        .notNull(),
    name: varchar({ length: 1024 }).notNull(),
    quantity: integer().notNull(),
    unitPrice: integer().notNull(), // in cents
    consolidationId: uuid(), // Reference will be set up in index.ts
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export const projectLabors = pgTable("project_labors", {
    id: uuid().primaryKey().defaultRandom(),
    projectId: uuid()
        .references(() => projects.id, { onDelete: "cascade" })
        .notNull(),
    name: varchar({ length: 1024 }).notNull(),
    hours: integer().notNull(),
    rate: integer().notNull(), // in cents per hour
    consolidationId: uuid(), // Reference will be set up in index.ts
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export const projectMisc = pgTable("project_misc", {
    id: uuid().primaryKey().defaultRandom(),
    projectId: uuid()
        .references(() => projects.id, { onDelete: "cascade" })
        .notNull(),
    name: varchar({ length: 1024 }).notNull(),
    amount: integer().notNull(), // in cents
    consolidationId: uuid(), // Reference will be set up in index.ts
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export const projectPayments = pgTable("project_payments", {
    id: uuid().primaryKey().defaultRandom(),
    projectId: uuid()
        .references(() => projects.id, { onDelete: "cascade" })
        .notNull(),
    amount: integer().notNull(), // in cents
    date: date({ mode: "date" }).notNull(),
    consolidationId: uuid(), // Reference will be set up in index.ts
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

