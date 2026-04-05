import { z } from "zod";
import { updateReconciliationSchema } from "../schemas/reconciliations.shared-schema";
import { db } from "@/db";
import { reconciliationListMapper } from "@/shared/mappers/reconciliations/reconciliation-list.mapper";
import { updateReconciliationWithRelatedItem } from "../utils";

export async function updateReconciliationMutation(
  data: z.infer<typeof updateReconciliationSchema>
) {
  const oldReconciliation = await db
    .selectFrom("reconciliations")
    .where("id", "=", data.id)
    .select([
      "projectStream",
      "projectItemId",
      "loanId",
      "loanPayoffId",
      "gstPaymentId",
    ])
    .executeTakeFirstOrThrow();

  const {
    projectStream: oldProjectStream,
    projectItemId: oldProjectItemId,
    loanId: oldLoanId,
    loanPayoffId: oldLoanPayoffId,
    gstPaymentId: oldGstPaymentId,
  } = oldReconciliation;

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
      .updateTable("reconciliations")
      .set(data)
      .where("id", "=", data.id)
      .returning(reconciliationListMapper)
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
        .set({ reconciliationId: null })
        .where("id", "=", oldProjectItemId)
        .execute();
    }

    if (oldLoanId && (oldLoanId !== data.loanId || data.loanPayoffId)) {
      await tx
        .updateTable("loans")
        .set({ reconciliationId: null })
        .where("id", "=", oldLoanId)
        .execute();
    }

    if (oldLoanPayoffId && oldLoanPayoffId !== data.loanPayoffId) {
      await tx
        .updateTable("loanPayoffs")
        .set({ reconciliationId: null })
        .where("id", "=", oldLoanPayoffId)
        .execute();
    }

    if (oldGstPaymentId && oldGstPaymentId !== data.gstPaymentId) {
      await tx
        .updateTable("gstPayments")
        .set({ reconciliationId: null })
        .where("id", "=", oldGstPaymentId)
        .execute();
    }

    await updateReconciliationWithRelatedItem(tx, reconciliation);

    return reconciliation;
  });
}
