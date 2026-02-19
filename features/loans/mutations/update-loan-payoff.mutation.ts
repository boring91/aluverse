import { z } from "zod";
import { db } from "@/db";
import { updateLoanPayoffSchema } from "../schemas/loan-payoffs.shared-schema";

export async function updateLoanPayoffMutation(
  data: z.infer<typeof updateLoanPayoffSchema>
) {
  return await db.transaction().execute(async (tx) => {
    // Get the current loan payoff to check for reconciliationId and amount
    const payoff = await tx
      .selectFrom("loanPayoffs")
      .select(["reconciliationId", "amount"])
      .where("id", "=", data.id)
      .executeTakeFirstOrThrow();

    // Only delete reconciliation if amount has changed
    const amountChanged = data.amount !== payoff.amount;

    if (payoff.reconciliationId && amountChanged) {
      await tx
        .deleteFrom("reconciliations")
        .where("id", "=", payoff.reconciliationId)
        .execute();
    }

    // Update the loan payoff
    return await tx
      .updateTable("loanPayoffs")
      .set(data)
      .where("id", "=", data.id)
      .returning(["id"])
      .executeTakeFirstOrThrow();
  });
}
