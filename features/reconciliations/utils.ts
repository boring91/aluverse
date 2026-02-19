import { ExpressionBuilder, Transaction } from "kysely";
import { DB } from "@/db/types";
import { InferMapper } from "@/lib/type";
import { reconciliationListMapper } from "@/shared/mappers/reconciliations/reconciliation-list.mapper";

export async function updateReconciliationWithRelatedItem(
  tx: Transaction<DB>,
  reconciliation: InferMapper<typeof reconciliationListMapper>
) {
  const { projectStream, projectItemId } = reconciliation;

  if (projectStream && projectItemId) {
    const tableMap = {
      supplies: "projectSupplies",
      labors: "projectLabors",
      misc: "projectMisc",
      payments: "projectPayments",
    } as const;

    const amountExpression = {
      supplies: (eb: ExpressionBuilder<DB, "projectSupplies">) =>
        eb("quantity", "*", eb.ref("unitPrice")).as("amount"),
      labors: (eb: ExpressionBuilder<DB, "projectLabors">) =>
        eb("rate", "*", eb.ref("hours")).as("amount"),
      misc: (eb: ExpressionBuilder<DB, "projectMisc">) =>
        eb.ref("amount").as("amount"),
      payments: (eb: ExpressionBuilder<DB, "projectPayments">) =>
        eb.ref("amount").as("amount"),
    } as const;

    // Ensure that the reconciled item amount matches the reconciliation amount
    const { amount } = await tx
      .selectFrom(tableMap[projectStream])
      .where("id", "=", projectItemId)
      .select(amountExpression[projectStream])
      .executeTakeFirstOrThrow();

    if (amount !== reconciliation.amount) {
      throw new Error(
        "Reconciliation amount does not match item amount. Please update the item amount to match the reconciliation amount."
      );
    }

    await tx
      .updateTable(tableMap[projectStream])
      .set({ reconciliationId: reconciliation.id })
      .where("id", "=", projectItemId)
      .execute();
  }

  if (reconciliation.reconciliationGroup === "loan") {
    if (reconciliation.isPayoff && reconciliation.loanPayoff?.id) {
      // Ensure that the reconciled payoff amount matches the reconciliation amount
      const { amount } = await tx
        .selectFrom("loanPayoffs")
        .where("id", "=", reconciliation.loanPayoff?.id)
        .select("amount")
        .executeTakeFirstOrThrow();

      if (amount !== reconciliation.amount) {
        throw new Error(
          "Reconciliation amount does not match payoff amount. Please update the payoff amount to match the reconciliation amount."
        );
      }

      await tx
        .updateTable("loanPayoffs")
        .set({ reconciliationId: reconciliation.id })
        .where("id", "=", reconciliation.loanPayoff.id)
        .execute();
    } else if (reconciliation.loan?.id) {
      // Ensure that the reconciled loan amount matches the reconciliation amount
      const { amount } = await tx
        .selectFrom("loans")
        .where("id", "=", reconciliation.loan?.id)
        .select("amount")
        .executeTakeFirstOrThrow();

      if (amount !== reconciliation.amount) {
        throw new Error(
          "Reconciliation amount does not match loan amount. Please update the loan amount to match the reconciliation amount."
        );
      }

      await tx
        .updateTable("loans")
        .set({ reconciliationId: reconciliation.id })
        .where("id", "=", reconciliation.loan.id)
        .execute();
    }
  }

  // Unlink other reconciliations that reference the same project item, if any
  if (reconciliation.projectItemId && reconciliation.projectStream) {
    await tx
      .deleteFrom("reconciliations")
      .where("projectItemId", "=", reconciliation.projectItemId)
      .where("id", "<>", reconciliation.id)
      .execute();
  }

  // For loans: Only reset the loanId if there is no payoffId, otherwise only reset loanPayoffId
  if (reconciliation.loanPayoff?.id) {
    // Reset other reconciliations that reference the same loan payoff id
    await tx
      .deleteFrom("reconciliations")
      .where("loanPayoffId", "=", reconciliation.loanPayoff.id)
      .where("id", "<>", reconciliation.id)
      .execute();
  } else if (reconciliation.loan?.id) {
    // Reset other reconciliations that reference the same loan id
    await tx
      .deleteFrom("reconciliations")
      .where("loanId", "=", reconciliation.loan?.id)
      .where("id", "<>", reconciliation.id)
      .execute();
  }
}
