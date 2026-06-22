import type { z } from "zod";
import { db } from "@/db";
import type { createProjectSupplyWithProjectIdSchema } from "../schemas/project-items.shared-schema";

export async function createProjectSupplyMutation(
  data: z.infer<typeof createProjectSupplyWithProjectIdSchema>,
) {
  return await db
    .insertInto("projectSupplies")
    .values(data)
    .returning(["id"])
    .executeTakeFirstOrThrow();
}
