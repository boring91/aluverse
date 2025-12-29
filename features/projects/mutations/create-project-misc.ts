import { z } from "zod";
import { db } from "@/db";
import { createProjectMiscWithProjectIdSchema } from "../schemas/project-item.schema";

export async function createProjectMisc(
    data: z.infer<typeof createProjectMiscWithProjectIdSchema>
) {
    return await db
        .insertInto("projectMisc")
        .values(data)
        .returning(["id"])
        .executeTakeFirstOrThrow();
}
