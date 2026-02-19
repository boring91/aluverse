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
    .select(["projectStream", "projectItemId", "loanId", "loanPayoffId"])
    .executeTakeFirstOrThrow();

  const {
    projectStream: oldProjectStream,
    projectItemId: oldProjectItemId,
    loanId: oldLoanId,
    loanPayoffId: oldLoanPayoffId,
  } = oldReconciliation;

  if (data.reconciliationGroup !== "budget") {
    data = {
      ...data,
      budgetCategoryId: undefined,
    };
  }

  // Reset fields that are not related to the selected group using spread operator
  if (data.reconciliationGroup === "project") {
    data = {
      ...data,
      loanId: undefined,
      loanPayoffId: undefined,
      budgetCategoryId: undefined,
    };
  } else if (data.reconciliationGroup === "loan") {
    data = {
      ...data,
      projectStream: undefined,
      projectItemId: undefined,
      budgetCategoryId: undefined,
    };
  } else if (data.reconciliationGroup === "budget") {
    data = {
      ...data,
      projectStream: undefined,
      projectItemId: undefined,
      loanId: undefined,
      loanPayoffId: undefined,
    };
  }

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

    await updateReconciliationWithRelatedItem(tx, reconciliation);

    return reconciliation;
  });
}
