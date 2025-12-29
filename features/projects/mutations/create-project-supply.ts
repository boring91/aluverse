import { z } from "zod";
import { db } from "@/db";
import { createProjectSupplyWithProjectIdSchema } from "../schemas/project-item.schema";

export async function createProjectSupply(
    data: z.infer<typeof createProjectSupplyWithProjectIdSchema>
) {
    return await db
        .insertInto("projectSupplies")
        .values(data)
        .returning(["id"])
        .executeTakeFirstOrThrow();
}
