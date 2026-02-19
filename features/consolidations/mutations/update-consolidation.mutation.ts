import { z } from "zod";
import { updateConsolidationSchema } from "../schemas/consolidations.shared-schema";
import { db } from "@/db";
import { consolidationListMapper } from "@/shared/mappers/consolidations/consolidation-list.mapper";
import { updateConsolidationWithRelatedItem } from "../utils";

export async function updateConsolidationMutation(
  data: z.infer<typeof updateConsolidationSchema>
) {
  const oldConsolidation = await db
    .selectFrom("consolidations")
    .where("id", "=", data.id)
    .select(["projectStream", "projectItemId", "loanId", "loanPayoffId"])
    .executeTakeFirstOrThrow();

  const {
    projectStream: oldProjectStream,
    projectItemId: oldProjectItemId,
    loanId: oldLoanId,
    loanPayoffId: oldLoanPayoffId,
  } = oldConsolidation;

  // Reset fields that are not related to the selected group using spread operator
  if (data.consolidationGroup === "project") {
    data = {
      ...data,
      loanId: undefined,
      loanPayoffId: undefined,
      budgetCategory: undefined,
    };
  } else if (data.consolidationGroup === "loan") {
    data = {
      ...data,
      projectStream: undefined,
      projectItemId: undefined,
      budgetCategory: undefined,
    };
  } else if (data.consolidationGroup === "budget") {
    data = {
      ...data,
      projectStream: undefined,
      projectItemId: undefined,
      loanId: undefined,
      loanPayoffId: undefined,
    };
  }

  return await db.transaction().execute(async (tx) => {
    const consolidation = await tx
      .updateTable("consolidations")
      .set(data)
      .where("id", "=", data.id)
      .returning(consolidationListMapper)
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
        .set({ consolidationId: null })
        .where("id", "=", oldProjectItemId)
        .execute();
    }

    if (oldLoanId && (oldLoanId !== data.loanId || data.loanPayoffId)) {
      await tx
        .updateTable("loans")
        .set({ consolidationId: null })
        .where("id", "=", oldLoanId)
        .execute();
    }

    if (oldLoanPayoffId && oldLoanPayoffId !== data.loanPayoffId) {
      await tx
        .updateTable("loanPayoffs")
        .set({ consolidationId: null })
        .where("id", "=", oldLoanPayoffId)
        .execute();
    }

    await updateConsolidationWithRelatedItem(tx, consolidation);

    return consolidation;
  });
}
