import { db } from "@/db";

export async function deleteLoanPayoffMutation(id: string) {
  return await db.transaction().execute(async (tx) => {
    const payoff = await db
      .deleteFrom("loanPayoffs")
      .where("id", "=", id)
      .returning(["id", "reconciliationId"])
      .executeTakeFirstOrThrow();

    if (!payoff.reconciliationId) return payoff;

    await tx
      .deleteFrom("reconciliations")
      .where("id", "=", payoff.reconciliationId)
      .execute();

    return payoff;
  });
}
