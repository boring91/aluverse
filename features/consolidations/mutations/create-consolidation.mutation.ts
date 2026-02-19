import { createConsolidationWithTransactionIdSchema } from "../schemas/consolidations.shared-schema";
import { z } from "zod";
import { db } from "@/db";
import { consolidationListMapper } from "@/shared/mappers/consolidations/consolidation-list.mapper";
import { updateConsolidationWithRelatedItem } from "../utils";

export async function createConsolidationMutation(
  data: z.infer<typeof createConsolidationWithTransactionIdSchema>
) {
  return await db.transaction().execute(async (tx) => {
    const consolidation = await tx
      .insertInto("consolidations")
      .values(data)
      .returning(consolidationListMapper)
      .executeTakeFirstOrThrow();

    await updateConsolidationWithRelatedItem(tx, consolidation);

    return consolidation;
  });
}
