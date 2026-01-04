import { z } from "zod";
import { updateLoanSchema } from "../schemas/loan.schemas";
import { db } from "@/db";

export async function updateLoan(data: z.infer<typeof updateLoanSchema>) {
  return await db.transaction().execute(async (tx) => {
    // Get the current loan to check for consolidationId and current amount
    const loan = await tx
      .selectFrom("loans")
      .select(["consolidationId", "amount"])
      .where("id", "=", data.id)
      .executeTakeFirstOrThrow();

    // Only delete consolidation if amount has changed
    const amountChanged = data.amount !== loan.amount;

    if (loan.consolidationId && amountChanged) {
      await tx
        .deleteFrom("consolidations")
        .where("id", "=", loan.consolidationId)
        .execute();
    }

    // Update the loan
    return await tx
      .updateTable("loans")
      .set(data)
      .where("id", "=", data.id)
      .returning(["id"])
      .executeTakeFirstOrThrow();
  });
}
