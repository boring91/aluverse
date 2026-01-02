import { z } from "zod";
import { db } from "@/db";
import { updateProjectLaborSchema } from "../schemas/project-items.schema";

export async function updateProjectLabor(
  data: z.infer<typeof updateProjectLaborSchema>
) {
  return await db
    .updateTable("projectLabors")
    .set(data)
    .where("id", "=", data.id)
    .returning(["id"])
    .executeTakeFirstOrThrow();
}
