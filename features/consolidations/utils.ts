import { ExpressionBuilder, Transaction } from "kysely";
import { createConsolidationSchema } from "./schemas/consolidations.schema";
import { DB } from "@/db/types";
import { z } from "zod";

export async function updateConsolidationWithRelatedItem(
  tx: Transaction<DB>,
  consolidationId: string,
  data: z.infer<typeof createConsolidationSchema>
) {
  const { projectStream, projectItemId } = data;

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

    if (amount !== data.amount) {
      throw new Error(
        "Consolidation amount does not match item amount. Please update the item amount to match the consolidation amount."
      );
    }

    await tx
      .updateTable(tableMap[projectStream])
      .set({ consolidationId })
      .where("id", "=", projectItemId)
      .execute();
  }

  if (data.consolidationGroup === "loan") {
    if (data.isPayoff && data.loanPayoffId) {
      // Ensure that the consolidated payoff amount matches the consolidation amount
      const { amount } = await tx
        .selectFrom("loanPayoffs")
        .where("id", "=", data.loanPayoffId)
        .select("amount")
        .executeTakeFirstOrThrow();

      if (amount !== data.amount) {
        throw new Error(
          "Consolidation amount does not match payoff amount. Please update the payoff amount to match the consolidation amount."
        );
      }

      await tx
        .updateTable("loanPayoffs")
        .set({ consolidationId })
        .where("id", "=", data.loanPayoffId)
        .execute();
    } else if (data.loanId) {
      // Ensure that the consolidated loan amount matches the consolidation amount
      const { amount } = await tx
        .selectFrom("loans")
        .where("id", "=", data.loanId)
        .select("amount")
        .executeTakeFirstOrThrow();

      if (amount !== data.amount) {
        throw new Error(
          "Consolidation amount does not match loan amount. Please update the loan amount to match the consolidation amount."
        );
      }

      await tx
        .updateTable("loans")
        .set({ consolidationId })
        .where("id", "=", data.loanId)
        .execute();
    }
  }
}
