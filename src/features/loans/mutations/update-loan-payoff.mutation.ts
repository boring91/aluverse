import type { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import type { updateLoanPayoffSchema } from "../schemas/loan-payoffs.shared-schema";
import { getLoanPayoffAmountSignError } from "../lib/loan-payoff-sign";

export async function updateLoanPayoffMutation(
  data: z.infer<typeof updateLoanPayoffSchema>,
) {
  return await db.transaction().execute(async (tx) => {
    // Get the current loan payoff to check for reconciliationId and amount
    const payoff = await tx
      .selectFrom("loanPayoffs")
      .innerJoin("loans", "loans.id", "loanPayoffs.loanId")
      .select([
        "loanPayoffs.reconciliationId",
        "loanPayoffs.amount",
        "loans.type as loanType",
      ])
      .where("loanPayoffs.id", "=", data.id)
      .executeTakeFirstOrThrow();

    const signError = getLoanPayoffAmountSignError(
      payoff.loanType,
      data.amount,
    );
    if (signError) {
      throw new TRPCError({ code: "BAD_REQUEST", message: signError });
    }

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
      .where("loanPayoffs.id", "=", data.id)
      .returning(["id"])
      .executeTakeFirstOrThrow();
  });
}
