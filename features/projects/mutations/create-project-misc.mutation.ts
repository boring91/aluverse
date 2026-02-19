import { z } from "zod";
import { db } from "@/db";
import { createProjectMiscWithProjectIdSchema } from "../schemas/project-items.shared-schema";

export async function createProjectMiscMutation(
  data: z.infer<typeof createProjectMiscWithProjectIdSchema>
) {
  return await db
    .insertInto("projectMisc")
    .values(data)
    .returning(["id"])
    .executeTakeFirstOrThrow();
}
