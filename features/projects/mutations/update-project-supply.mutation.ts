import { z } from "zod";
import { db } from "@/db";
import { updateProjectSupplySchema } from "../schemas/project-items.shared-schema";

export async function updateProjectSupplyMutation(
  data: z.infer<typeof updateProjectSupplySchema>
) {
  return await db.transaction().execute(async (tx) => {
    // Get the current supply to check for consolidationId and current amount fields
    const supply = await tx
      .selectFrom("projectSupplies")
      .select(["consolidationId", "quantity", "unitPrice"])
      .where("id", "=", data.id)
      .executeTakeFirstOrThrow();

    // Only delete consolidation if amount is changed (quantity or unitPrice has changed)
    const quantityChanged = data.quantity !== supply.quantity;
    const unitPriceChanged = data.unitPrice !== supply.unitPrice;

    if (supply.consolidationId && (quantityChanged || unitPriceChanged)) {
      await tx
        .deleteFrom("consolidations")
        .where("id", "=", supply.consolidationId)
        .execute();
    }

    // Update the supply
    return await tx
      .updateTable("projectSupplies")
      .set(data)
      .where("id", "=", data.id)
      .returning(["id"])
      .executeTakeFirstOrThrow();
  });
}
