import { z } from "zod";
import { updateConsolidationSchema } from "@/features/consolidations";
import { db } from "@/db";
import { consolidationMapper } from "@/db/mappers"

export async function updateConsolidation(
    data: z.infer<typeof updateConsolidationSchema>
) {
    return await db
        .updateTable("consolidations")
        .set(data)
        .where("id", "=", data.id)
        .returning(consolidationMapper)
        .executeTakeFirstOrThrow();
}
