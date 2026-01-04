import { z } from "zod";
import { db } from "@/db";
import { updateLoanPayoffSchema } from "../schemas/loan-payoffs.schema";

export async function updateLoanPayoff(
  data: z.infer<typeof updateLoanPayoffSchema>
) {
  return await db.transaction().execute(async (tx) => {
    // Get the current loan payoff to check for consolidationId and amount
    const payoff = await tx
      .selectFrom("loanPayoffs")
      .select(["consolidationId", "amount"])
      .where("id", "=", data.id)
      .executeTakeFirstOrThrow();

    // Only delete consolidation if amount has changed
    const amountChanged = data.amount !== payoff.amount;

    if (payoff.consolidationId && amountChanged) {
      await tx
        .deleteFrom("consolidations")
        .where("id", "=", payoff.consolidationId)
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
