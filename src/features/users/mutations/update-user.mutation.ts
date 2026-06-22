import type { z } from "zod";
import { db } from "@/db";
import { userFullMapper } from "@/shared/mappers/users/user-full.mapper";
import { hashPassword } from "better-auth/crypto";
import type { updateUserSchema } from "../schemas/users.shared-schema";
import { getCurrentTime } from "@/lib/utils";

export async function updateUserMutation(
  data: z.infer<typeof updateUserSchema>,
) {
  const { id, password, ...values } = data;

  const updatedUser = await db
    .updateTable("users")
    .set(values)
    .where("users.id", "=", id)
    .returning(["users.id"])
    .executeTakeFirst();

  if (!updatedUser) {
    return null;
  }

  const normalizedPassword =
    typeof password === "string" && password.trim().length > 0
      ? password.trim()
      : undefined;

  const now = getCurrentTime();

  const credentialAccount = await db
    .selectFrom("accounts")
    .where("accounts.userId", "=", id)
    .where("accounts.providerId", "=", "credential")
    .select(["accounts.id"])
    .executeTakeFirst();

  if (normalizedPassword) {
    const hashedPassword = await hashPassword(normalizedPassword);

    if (credentialAccount) {
      await db
        .updateTable("accounts")
        .set({
          accountId: values.email,
          password: hashedPassword,
          updatedAt: now,
        })
        .where("accounts.id", "=", credentialAccount.id)
        .execute();
    } else {
      await db
        .insertInto("accounts")
        .values({
          id: crypto.randomUUID(),
          accountId: values.email,
          providerId: "credential",
          userId: id,
          password: hashedPassword,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    }
  } else if (credentialAccount) {
    await db
      .updateTable("accounts")
      .set({
        accountId: values.email,
        updatedAt: now,
      })
      .where("accounts.id", "=", credentialAccount.id)
      .execute();
  }

  return await db
    .selectFrom("users")
    .where("users.id", "=", id)
    .select(userFullMapper)
    .executeTakeFirst();
}
