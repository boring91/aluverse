import { z } from "zod";
import { updateConsolidationSchema } from "@/features/consolidations";
import { db } from "@/db";
import { consolidationMapper } from "@/db/mappers";

export async function updateConsolidation(
  data: z.infer<typeof updateConsolidationSchema>
) {
  const oldConsolidation = await db
    .selectFrom("consolidations")
    .where("id", "=", data.id)
    .select(["projectStream", "projectItemId"])
    .executeTakeFirstOrThrow();

  const { projectStream: oldProjectStream, projectItemId: oldProjectItemId } =
    oldConsolidation;

  return await db.transaction().execute(async (tx) => {
    const consolidation = await tx
      .updateTable("consolidations")
      .set(data)
      .where("id", "=", data.id)
      .returning(consolidationMapper)
      .executeTakeFirstOrThrow();

    const tableMap = {
      supplies: "projectSupplies",
      labors: "projectLabors",
      misc: "projectMisc",
      payments: "projectPayments",
    } as const;

    if (
      oldProjectStream &&
      oldProjectItemId &&
      oldProjectItemId !== data.projectItemId
    ) {
      await tx
        .updateTable(tableMap[oldProjectStream])
        .set({ consolidationId: null })
        .where("id", "=", oldProjectItemId)
        .execute();
    }

    if (data.projectStream && data.projectItemId) {
      await tx
        .updateTable(tableMap[data.projectStream])
        .set({ consolidationId: consolidation.id })
        .where("id", "=", data.projectItemId)
        .execute();
    }

    return consolidation;
  });
}
