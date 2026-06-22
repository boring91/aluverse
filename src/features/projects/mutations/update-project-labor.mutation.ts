import type { z } from "zod";
import { db } from "@/db";
import type { updateProjectLaborSchema } from "../schemas/project-items.shared-schema";

export async function updateProjectLaborMutation(
  data: z.infer<typeof updateProjectLaborSchema>,
) {
  return await db.transaction().execute(async (tx) => {
    // Get the current labor to check for reconciliationId and current rate/hours
    const labor = await tx
      .selectFrom("projectLabors")
      .select(["reconciliationId", "rate", "hours"])
      .where("id", "=", data.id)
      .executeTakeFirstOrThrow();

    // Only delete reconciliation if rate or hours is changed
    const rateChanged = data.rate !== labor.rate;
    const hoursChanged = data.hours !== labor.hours;

    if (labor.reconciliationId && (rateChanged || hoursChanged)) {
      await tx
        .deleteFrom("reconciliations")
        .where("id", "=", labor.reconciliationId)
        .execute();
    }

    // Update the labor
    return await tx
      .updateTable("projectLabors")
      .set(data)
      .where("id", "=", data.id)
      .returning(["id"])
      .executeTakeFirstOrThrow();
  });
}
