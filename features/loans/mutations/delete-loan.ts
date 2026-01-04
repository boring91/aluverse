import { db } from "@/db";

export async function deleteLoan(id: string) {
  return await db.transaction().execute(async (tx) => {
    // Delete loan payoffs associated with this loan
    const payoffs = await db
      .deleteFrom("loanPayoffs")
      .where("loanId", "=", id)
      .returning(["id", "consolidationId"])
      .execute();

    // Delete any related consolidations for payoffs
    const payoffConsolidationIds = payoffs
      .map((payoff) => payoff.consolidationId)
      .filter((id): id is string => !!id);

    if (payoffConsolidationIds.length > 0) {
      await tx
        .deleteFrom("consolidations")
        .where("id", "in", payoffConsolidationIds)
        .execute();
    }

    // Delete the loan and get its info (including consolidationId)
    const loan = await db
      .deleteFrom("loans")
      .where("id", "=", id)
      .returning(["id", "consolidationId"])
      .executeTakeFirstOrThrow();

    // Delete the loan's consolidation if it exists
    if (loan.consolidationId) {
      await tx
        .deleteFrom("consolidations")
        .where("id", "=", loan.consolidationId)
        .execute();
    }
    return loan;
  });
}
