import { z } from "zod";
import { db } from "@/db";
import { createProjectLaborWithProjectIdSchema } from "../schemas/project-items.schema";

export async function createProjectLabor(
    data: z.infer<typeof createProjectLaborWithProjectIdSchema>
) {
    return await db
        .insertInto("projectLabors")
        .values(data)
        .returning(["id"])
        .executeTakeFirstOrThrow();
}
