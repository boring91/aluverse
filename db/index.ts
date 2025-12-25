import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import * as authSchema from "./schemas/auth";
import * as financialAccountsSchema from "./schemas/financial-accounts";
import * as transactionsSchema from "./schemas/transactions";
import * as projectsSchema from "./schemas/projects";
import * as consolidationsSchema from "./schemas/consolidations";

// Combine all schemas
const schema = {
    ...authSchema,
    ...financialAccountsSchema,
    ...transactionsSchema,
    ...projectsSchema,
    ...consolidationsSchema,
};

export const db = drizzle({
    connection: {
        connectionString: process.env.DATABASE_URL!,
    },
    casing: "snake_case",
    schema,
});

// Re-export all schema tables and types
export * from "./schemas/auth";
export * from "./schemas/financial-accounts";
export * from "./schemas/transactions";
export * from "./schemas/projects";
export * from "./schemas/consolidations";

