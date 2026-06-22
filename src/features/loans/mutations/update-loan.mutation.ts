import type { z } from "zod";
import type { updateLoanSchema } from "../schemas/loans.shared-schema";
import { db } from "@/db";

export async function updateLoanMutation(
  data: z.infer<typeof updateLoanSchema>,
) {
  return await db.transaction().execute(async (tx) => {
    // Get the current loan to check for reconciliationId and current amount
    const loan = await tx
      .selectFrom("loans")
      .select(["reconciliationId", "amount"])
      .where("id", "=", data.id)
      .executeTakeFirstOrThrow();

    // Only delete reconciliation if amount has changed
    const amountChanged = data.amount !== loan.amount;

    if (loan.reconciliationId && amountChanged) {
      await tx
        .deleteFrom("reconciliations")
        .where("id", "=", loan.reconciliationId)
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
