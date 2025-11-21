import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db"; // your drizzle instance

export const auth = betterAuth({
    baseURL: process.env.NEXT_PUBLIC_APP_URL!,
    database: drizzleAdapter(db, {
        provider: "pg",
        usePlural: true,
    }),
    emailAndPassword: {
        enabled: true,
    },
});
