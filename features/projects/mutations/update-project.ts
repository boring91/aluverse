import { z } from "zod";
import { db } from "@/db";
import { projectMapper } from "@/db/mappers";
import { updateProjectSchema } from "../schemas/projects.schema";

export async function updateProject(data: z.infer<typeof updateProjectSchema>) {
  return await db
    .updateTable("projects")
    .set(data)
    .where("id", "=", data.id)
    .returning(projectMapper)
    .executeTakeFirstOrThrow();
}
