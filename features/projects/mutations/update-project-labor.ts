import { z } from "zod";
import { db } from "@/db";
import { updateProjectLaborSchema } from "../schemas/project-items.schema";

export async function updateProjectLabor(
  data: z.infer<typeof updateProjectLaborSchema>
) {
  return await db.transaction().execute(async (tx) => {
    // Get the current labor to check for consolidationId and current rate/hours
    const labor = await tx
      .selectFrom("projectLabors")
      .select(["consolidationId", "rate", "hours"])
      .where("id", "=", data.id)
      .executeTakeFirstOrThrow();

    // Only delete consolidation if rate or hours is changed
    const rateChanged = data.rate !== labor.rate;
    const hoursChanged = data.hours !== labor.hours;

    if (labor.consolidationId && (rateChanged || hoursChanged)) {
      await tx
        .deleteFrom("consolidations")
        .where("id", "=", labor.consolidationId)
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
