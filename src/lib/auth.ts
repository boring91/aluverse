import { db } from "@/db";
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";

const appUrl = process.env.VITE_API_URL ?? "http://localhost:3000";
const trustedOrigins = Array.from(
  new Set([appUrl, "http://localhost:3000", "http://localhost:3001"]),
);

export const auth = betterAuth({
  baseURL: appUrl,
  trustedOrigins,
  database: {
    db,
    type: "postgres",
  },
  user: {
    modelName: "users",
  },
  session: {
    modelName: "sessions",
  },
  account: {
    modelName: "accounts",
  },
  verification: {
    modelName: "verifications",
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [tanstackStartCookies()],
});
