import { z } from "zod";
import { db } from "@/db";
import { updateProjectSupplySchema } from "../schemas/project-item.schema";

export async function updateProjectSupply(
    data: z.infer<typeof updateProjectSupplySchema>
) {
    return await db
        .updateTable("projectSupplies")
        .set(data)
        .where("id", "=", data.id)
        .returning(["id"])
        .executeTakeFirstOrThrow();
}
