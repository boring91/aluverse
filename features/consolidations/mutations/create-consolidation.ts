import { createConsolidationWithTransactionIdSchema } from "@/features/consolidations";
import { z } from "zod";
import { db } from "@/db";
import { consolidationMapper } from "@/db/mappers";
import { updateConsolidationWithRelatedItem } from "../utils";

export async function createConsolidation(
  data: z.infer<typeof createConsolidationWithTransactionIdSchema>
) {
  return await db.transaction().execute(async (tx) => {
    const consolidation = await tx
      .insertInto("consolidations")
      .values(data)
      .returning(consolidationMapper)
      .executeTakeFirstOrThrow();

    await updateConsolidationWithRelatedItem(tx, consolidation.id, data);

    return consolidation;
  });
}
