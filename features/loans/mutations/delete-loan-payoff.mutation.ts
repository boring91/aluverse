import { db } from "@/db";

export async function deleteLoanPayoffMutation(id: string) {
  return await db.transaction().execute(async (tx) => {
    const payoff = await db
      .deleteFrom("loanPayoffs")
      .where("id", "=", id)
      .returning(["id", "consolidationId"])
      .executeTakeFirstOrThrow();

    if (!payoff.consolidationId) return payoff;

    await tx
      .deleteFrom("consolidations")
      .where("id", "=", payoff.consolidationId)
      .execute();

    return payoff;
  });
}
