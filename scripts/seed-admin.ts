import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db, users } from "@/db";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

const main = async (): Promise<void> => {
    const email = "admin@aluverse.com.au";
    const password = "12345678";
    const name = "Admin";

    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

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
