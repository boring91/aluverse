import { createReconciliationWithTransactionIdSchema } from "../schemas/reconciliations.shared-schema";
import { z } from "zod";
import { db } from "@/db";
import { reconciliationListMapper } from "@/shared/mappers/reconciliations/reconciliation-list.mapper";
import { updateReconciliationWithRelatedItem } from "../utils";

export async function createReconciliationMutation(
  data: z.infer<typeof createReconciliationWithTransactionIdSchema>
) {
  if (data.reconciliationGroup !== "budget") {
    data = {
      ...data,
      budgetCategoryId: undefined,
    };
  }

  return await db.transaction().execute(async (tx) => {
    const reconciliation = await tx
      .insertInto("reconciliations")
      .values(data)
      .returning(reconciliationListMapper)
      .executeTakeFirstOrThrow();

    await updateReconciliationWithRelatedItem(tx, reconciliation);

    return reconciliation;
  });
}
