import { createConsolidationWithTransactionIdSchema } from "@/features/consolidations";
import { z } from "zod";
import { db } from "@/db";
import { consolidationMapper } from "@/db/mappers";

export async function createConsolidation(
    data: z.infer<typeof createConsolidationWithTransactionIdSchema>
) {
    return db
        .insertInto("consolidations")
        .values(data)
        .returning(consolidationMapper)
        .executeTakeFirstOrThrow();
}
