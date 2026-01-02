import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { auth } from "@/lib/auth";
import { db } from "@/db";

const main = async (): Promise<void> => {
  const email = "admin@aluverse.com.au";
  const password = "12345678";
  const name = "Admin";

  const existingUser = await db
    .selectFrom("users")
    .where("email", "=", email)
    .select(["id"])
    .executeTakeFirst();

  if (existingUser) {
    console.log("User already exists. Exiting...");
  }

  try {
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });
    console.log("Admin user seeded successfully.");
  } catch {
    console.log("An error has occurred while seeding admin.");
  } finally {
    process.exit(0);
  }
};

main();
