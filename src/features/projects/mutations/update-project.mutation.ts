import type { z } from "zod";
import { db } from "@/db";
import { projectListMapper } from "@/shared/mappers/projects/project-list.mapper";
import type { updateProjectSchema } from "../schemas/projects.shared-schema";

export async function updateProjectMutation(
  data: z.infer<typeof updateProjectSchema>,
) {
  return await db
    .updateTable("projects")
    .set(data)
    .where("id", "=", data.id)
    .returning(projectListMapper)
    .executeTakeFirstOrThrow();
}
