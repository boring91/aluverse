import { createConsolidationWithTransactionIdSchema } from "@/features/consolidations";
import { z } from "zod";
import { db } from "@/db";
import { consolidationMapper } from "@/db/mappers";

export async function createConsolidation(
  data: z.infer<typeof createConsolidationWithTransactionIdSchema>
) {
  return await db.transaction().execute(async (tx) => {
    const consolidation = await tx
      .insertInto("consolidations")
      .values(data)
      .returning(consolidationMapper)
      .executeTakeFirstOrThrow();

    const { projectStream, projectItemId } = data;

    if (projectStream && projectItemId) {
      const tableMap = {
        supplies: "projectSupplies",
        labors: "projectLabors",
        misc: "projectMisc",
        payments: "projectPayments",
      } as const;

      await tx
        .updateTable(tableMap[projectStream])
        .set({ consolidationId: consolidation.id })
        .where("id", "=", projectItemId)
        .execute();
    }

    return consolidation;
  });
}
