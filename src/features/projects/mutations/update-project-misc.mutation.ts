import type { z } from "zod";
import { db } from "@/db";
import type { updateProjectMiscSchema } from "../schemas/project-items.shared-schema";

export async function updateProjectMiscMutation(
  data: z.infer<typeof updateProjectMiscSchema>,
) {
  return await db.transaction().execute(async (tx) => {
    // Get the current misc to check for reconciliationId and current amount
    const misc = await tx
      .selectFrom("projectMisc")
      .select(["reconciliationId", "amount"])
      .where("id", "=", data.id)
      .executeTakeFirstOrThrow();

    // Only delete reconciliation if amount has changed
    const amountChanged = data.amount !== misc.amount;

    if (misc.reconciliationId && amountChanged) {
      await tx
        .deleteFrom("reconciliations")
        .where("id", "=", misc.reconciliationId)
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
