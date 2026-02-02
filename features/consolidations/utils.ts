import { ExpressionBuilder, Transaction } from "kysely";
import { DB } from "@/db/types";
import { InferMapper } from "@/lib/type";
import { consolidationMapper } from "@/db/mappers";

export async function updateConsolidationWithRelatedItem(
  tx: Transaction<DB>,
  consolidation: InferMapper<typeof consolidationMapper>
) {
  const { projectStream, projectItemId } = consolidation;

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

    // Ensure that the consolidated item amount matches the consolidation amount
    const { amount } = await tx
      .selectFrom(tableMap[projectStream])
      .where("id", "=", projectItemId)
      .select(amountExpression[projectStream])
      .executeTakeFirstOrThrow();

    if (amount !== consolidation.amount) {
      throw new Error(
        "Consolidation amount does not match item amount. Please update the item amount to match the consolidation amount."
      );
    }

    await tx
      .updateTable(tableMap[projectStream])
      .set({ consolidationId: consolidation.id })
      .where("id", "=", projectItemId)
      .execute();
  }

  if (consolidation.consolidationGroup === "loan") {
    if (consolidation.isPayoff && consolidation.loanPayoff?.id) {
      // Ensure that the consolidated payoff amount matches the consolidation amount
      const { amount } = await tx
        .selectFrom("loanPayoffs")
        .where("id", "=", consolidation.loanPayoff?.id)
        .select("amount")
        .executeTakeFirstOrThrow();

      if (amount !== consolidation.amount) {
        throw new Error(
          "Consolidation amount does not match payoff amount. Please update the payoff amount to match the consolidation amount."
        );
      }

      await tx
        .updateTable("loanPayoffs")
        .set({ consolidationId: consolidation.id })
        .where("id", "=", consolidation.loanPayoff.id)
        .execute();
    } else if (consolidation.loan?.id) {
      // Ensure that the consolidated loan amount matches the consolidation amount
      const { amount } = await tx
        .selectFrom("loans")
        .where("id", "=", consolidation.loan?.id)
        .select("amount")
        .executeTakeFirstOrThrow();

      if (amount !== consolidation.amount) {
        throw new Error(
          "Consolidation amount does not match loan amount. Please update the loan amount to match the consolidation amount."
        );
      }

      await tx
        .updateTable("loans")
        .set({ consolidationId: consolidation.id })
        .where("id", "=", consolidation.loan.id)
        .execute();
    }
  }

  // Unlink other consolidations that reference the same project item, if any
  if (consolidation.projectItemId && consolidation.projectStream) {
    await tx
      .deleteFrom("consolidations")
      .where("projectItemId", "=", consolidation.projectItemId)
      .where("id", "<>", consolidation.id)
      .execute();
  }

  // For loans: Only reset the loanId if there is no payoffId, otherwise only reset loanPayoffId
  if (consolidation.loanPayoff?.id) {
    // Reset other consolidations that reference the same loan payoff id
    await tx
      .deleteFrom("consolidations")
      .where("loanPayoffId", "=", consolidation.loanPayoff.id)
      .where("id", "<>", consolidation.id)
      .execute();
  } else if (consolidation.loan?.id) {
    // Reset other consolidations that reference the same loan id
    await tx
      .deleteFrom("consolidations")
      .where("loanId", "=", consolidation.loan?.id)
      .where("id", "<>", consolidation.id)
      .execute();
  }
}
