import {
    transactionBudgetCategories,
    transactionConsolidationGroups,
    transactionTypes,
} from "@/lib/constants";
import { sql } from "drizzle-orm";
import {
    pgTable,
    text,
    timestamp,
    boolean,
    uuid,
    date,
    varchar,
    integer,
    pgEnum,
    doublePrecision,
    check,
} from "drizzle-orm/pg-core";

// Better auth
export const users = pgTable("users", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
});

export const sessions = pgTable("sessions", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = pgTable("accounts", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
});

export const verifications = pgTable("verifications", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
});

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

export const transactionType = pgEnum("transaction_type", transactionTypes);

export const transactionConsolidatedGroup = pgEnum(
    "transaction_consolidation_group",
    transactionConsolidationGroups
);
export const transactionBudgetCategory = pgEnum(
    "transaction_budget_category",
    transactionBudgetCategories
);
export const transactions = pgTable(
    "transactions",
    {
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
        isGst: boolean(),
        consolidationGroup: transactionConsolidatedGroup(),
        budgetCategory: transactionBudgetCategory(),
        projectId: uuid().references(() => projects.id, {
            onDelete: "set null",
        }),
        updatedAt: timestamp()
            .notNull()
            .defaultNow()
            .$onUpdate(() => new Date()),
    },
    table => {
        return [
            // ensure budget category is only set if consolidation group is budget
            check(
                "budget_category_check_constraint",
                sql`${table.consolidationGroup} <> 'budget' OR ${table.budgetCategory} IS NOT NULL`
            ),

            // ensure project id is only set if consolidation group is project
            check(
                "project_id_check_constraint",
                sql`${table.consolidationGroup} <> 'project' OR ${table.projectId} IS NOT NULL`
            ),
        ];
    }
);

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
});

export const projectLabors = pgTable("project_labors", {
    id: uuid().primaryKey().defaultRandom(),
    projectId: uuid()
        .references(() => projects.id, { onDelete: "cascade" })
        .notNull(),
    name: varchar({ length: 1024 }).notNull(),
    hours: integer().notNull(),
    rate: integer().notNull(), // in cents per hour
});

export const projectMisc = pgTable("project_misc", {
    id: uuid().primaryKey().defaultRandom(),
    projectId: uuid()
        .references(() => projects.id, { onDelete: "cascade" })
        .notNull(),
    name: varchar({ length: 1024 }).notNull(),
    amount: integer().notNull(), // in cents
});

export const projectPayments = pgTable("project_payments", {
    id: uuid().primaryKey().defaultRandom(),
    projectId: uuid()
        .references(() => projects.id, { onDelete: "cascade" })
        .notNull(),
    amount: integer().notNull(), // in cents
    date: date({ mode: "date" }).notNull(),
});
