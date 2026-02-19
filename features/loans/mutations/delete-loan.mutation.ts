import { db } from "@/db";
import { jsonArrayFrom } from "@/db/json-helpers";

export async function deleteLoanMutation(id: string) {
  return await db.transaction().execute(async (tx) => {
    const loan = await tx
      .selectFrom("loans")
      .where("id", "=", id)
      .select((eb) => [
        "consolidationId",
        jsonArrayFrom(
          eb
            .selectFrom("loanPayoffs")
            .whereRef("loanId", "=", "loans.id")
            .select(["loanPayoffs.id", "loanPayoffs.consolidationId"])
        ).as("payoffs"),
      ])
      .executeTakeFirst();

    if (!loan) return;

    // Remove all consolidations if any
    const consolidationIds = [
      loan.consolidationId,
      ...loan.payoffs.map((x) => x.consolidationId),
    ].filter((id): id is string => !!id);

    if (consolidationIds.length) {
      await tx
        .deleteFrom("consolidations")
        .where("id", "in", consolidationIds)
        .execute();
    }

    // Remove all payoffs
    const payoffIds = loan.payoffs
      .map((x) => x.id)
      .filter((id): id is string => !!id);
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
