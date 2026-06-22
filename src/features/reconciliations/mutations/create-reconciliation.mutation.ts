import type { z } from "zod";
import type { createReconciliationWithTransactionIdSchema } from "../schemas/reconciliations.shared-schema";
import { db } from "@/db";
import { reconciliationListMapper } from "@/shared/mappers/reconciliations/reconciliation-list.mapper";
import { updateReconciliationWithRelatedItem } from "../utils";

export async function createReconciliationMutation(
  data: z.infer<typeof createReconciliationWithTransactionIdSchema>,
) {
  data = {
    ...data,
    budgetCategoryId:
      data.reconciliationGroup === "budget" ? data.budgetCategoryId : undefined,
    projectId:
      data.reconciliationGroup === "project" ? data.projectId : undefined,
    projectStream:
      data.reconciliationGroup === "project" ? data.projectStream : undefined,
    projectItemId:
      data.reconciliationGroup === "project" ? data.projectItemId : undefined,
    loanId: data.reconciliationGroup === "loan" ? data.loanId : undefined,
    isPayoff: data.reconciliationGroup === "loan" ? data.isPayoff : undefined,
    loanPayoffId:
      data.reconciliationGroup === "loan" ? data.loanPayoffId : undefined,
    gstPaymentId:
      data.reconciliationGroup === "gst_payable"
        ? data.gstPaymentId
        : undefined,
  };

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
