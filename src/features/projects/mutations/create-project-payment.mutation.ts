import type { z } from "zod";
import { db } from "@/db";
import type { createProjectPaymentWithProjectIdSchema } from "../schemas/project-items.shared-schema";

export async function createProjectPaymentMutation(
  data: z.infer<typeof createProjectPaymentWithProjectIdSchema>,
) {
  return await db
    .insertInto("projectPayments")
    .values(data)
    .returning(["id"])
    .executeTakeFirstOrThrow();
}
