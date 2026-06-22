import type { z } from "zod";
import { db } from "@/db";
import type { createProjectLaborWithProjectIdSchema } from "../schemas/project-items.shared-schema";

export async function createProjectLaborMutation(
  data: z.infer<typeof createProjectLaborWithProjectIdSchema>,
) {
  return await db
    .insertInto("projectLabors")
    .values(data)
    .returning(["id"])
    .executeTakeFirstOrThrow();
}
