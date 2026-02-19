import { db } from "@/db";
import { auth } from "@/lib/auth";
import { userFullMapper } from "@/shared/mappers/users/user-full.mapper";
import { z } from "zod";
import { createUserSchema } from "../schemas/users.shared-schema";

export async function createUserMutation(
  data: z.infer<typeof createUserSchema>
) {
  await auth.api.signUpEmail({
    body: {
      name: data.name,
      email: data.email,
      password: data.password,
    },
  });

  return await db
    .selectFrom("users")
    .where("users.email", "=", data.email)
    .select(userFullMapper)
    .executeTakeFirstOrThrow();
}
