import { db } from "@/db";
import { jsonArrayFrom } from "@/db/json-helpers";

export async function deleteLoanMutation(id: string) {
  return await db.transaction().execute(async (tx) => {
    const loan = await tx
      .selectFrom("loans")
      .where("id", "=", id)
      .select((eb) => [
        "reconciliationId",
        jsonArrayFrom(
          eb
            .selectFrom("loanPayoffs")
            .whereRef("loanId", "=", "loans.id")
            .select(["loanPayoffs.id", "loanPayoffs.reconciliationId"]),
        ).as("payoffs"),
      ])
      .executeTakeFirst();

    if (!loan) return;

    // Remove all reconciliations if any
    const reconciliationIds = [
      loan.reconciliationId,
      ...loan.payoffs.map((x) => x.reconciliationId),
    ].filter(
      (reconciliationId): reconciliationId is string => !!reconciliationId,
    );

    if (reconciliationIds.length) {
      await tx
        .deleteFrom("reconciliations")
        .where("id", "in", reconciliationIds)
        .execute();
    }

    // Remove all payoffs
    const payoffIds = loan.payoffs
      .map((x) => x.id)
      .filter((payoffId): payoffId is string => !!payoffId);
    if (payoffIds.length) {
      await tx.deleteFrom("loanPayoffs").where("id", "in", payoffIds).execute();
    }

    // Remove the loan
    return await tx
      .deleteFrom("loans")
      .where("id", "=", id)
      .returning(["id"])
      .execute();
  });
}
