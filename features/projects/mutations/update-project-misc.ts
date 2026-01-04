import { z } from "zod";
import { db } from "@/db";
import { updateProjectMiscSchema } from "../schemas/project-items.schema";

export async function updateProjectMisc(
  data: z.infer<typeof updateProjectMiscSchema>
) {
  return await db.transaction().execute(async (tx) => {
    // Get the current misc to check for consolidationId and current amount
    const misc = await tx
      .selectFrom("projectMisc")
      .select(["consolidationId", "amount"])
      .where("id", "=", data.id)
      .executeTakeFirstOrThrow();

    // Only delete consolidation if amount has changed
    const amountChanged = data.amount !== misc.amount;

    if (misc.consolidationId && amountChanged) {
      await tx
        .deleteFrom("consolidations")
        .where("id", "=", misc.consolidationId)
        .execute();
    }

    // Update the misc
    return await tx
      .updateTable("projectMisc")
      .set(data)
      .where("id", "=", data.id)
      .returning(["id"])
      .executeTakeFirstOrThrow();
  });
}
