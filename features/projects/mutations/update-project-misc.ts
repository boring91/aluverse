import { z } from "zod";
import { db } from "@/db";
import { updateProjectMiscSchema } from "../schemas/project-items.schema";

export async function updateProjectMisc(
    data: z.infer<typeof updateProjectMiscSchema>
) {
    return await db
        .updateTable("projectMisc")
        .set(data)
        .where("id", "=", data.id)
        .returning(["id"])
        .executeTakeFirstOrThrow();
}
