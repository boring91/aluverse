import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    out: "./db/migrations",
    schema: "./db/schemas",
    dialect: "postgresql",
    casing: "snake_case",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
