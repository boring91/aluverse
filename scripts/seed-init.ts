import { db } from "@/db";
import { auth } from "@/lib/auth";
import { resolveUserAccessQuery } from "@/features/rbac/queries/resolve-user-access.query";

async function seedAdmin() {
  const existingUser = await db
    .selectFrom("users")
    .select(["id", "email"])
    .limit(1)
    .executeTakeFirst();

  if (existingUser) {
    console.info("User already exists. Skipping init seed.");
    return;
  }

  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Platform Admin";

  if (!email || !password) {
    throw new Error(
      "No user exists and ADMIN_EMAIL / ADMIN_PASSWORD are not set.",
    );
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
  }

  await auth.api.signUpEmail({
    body: {
      email,
      password,
      name,
    },
  });

  const seededUser = await db
    .selectFrom("users")
    .where("users.email", "=", email)
    .select(["id"])
    .executeTakeFirstOrThrow();

  await resolveUserAccessQuery(seededUser.id);
  console.info(`Seeded admin user: ${email}`);
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
