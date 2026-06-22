import type { z } from "zod";
import { db } from "@/db";
import type { updateProjectSupplySchema } from "../schemas/project-items.shared-schema";

export async function updateProjectSupplyMutation(
  data: z.infer<typeof updateProjectSupplySchema>,
) {
  return await db.transaction().execute(async (tx) => {
    // Get the current supply to check for reconciliationId and current amount fields
    const supply = await tx
      .selectFrom("projectSupplies")
      .select(["reconciliationId", "quantity", "unitPrice"])
      .where("id", "=", data.id)
      .executeTakeFirstOrThrow();

    // Only delete reconciliation if amount is changed (quantity or unitPrice has changed)
    const quantityChanged = data.quantity !== supply.quantity;
    const unitPriceChanged = data.unitPrice !== supply.unitPrice;

    if (supply.reconciliationId && (quantityChanged || unitPriceChanged)) {
      await tx
        .deleteFrom("reconciliations")
        .where("id", "=", supply.reconciliationId)
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
