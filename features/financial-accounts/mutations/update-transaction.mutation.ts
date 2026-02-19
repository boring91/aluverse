import { z } from "zod";
import { db } from "@/db";
import { transactionListMapper } from "@/shared/mappers/transactions/transaction-list.mapper";
import { updateTransactionSchema } from "../schemas/transactions.shared-schema";

export async function updateTransactionMutation(
  data: z.infer<typeof updateTransactionSchema>
) {
  return await db.transaction().execute(async (tx) => {
    // First, fetch the old transaction to compare the amount
    const oldTransaction = await tx
      .selectFrom("transactions")
      .select(["amount"])
      .where("id", "=", data.id)
      .executeTakeFirst();

    if (!oldTransaction) {
      throw new Error("Transaction not found");
    }

    // If the amount is being updated and actually changed, remove associated reconciliations
    if (data.amount !== oldTransaction.amount) {
      await tx
        .deleteFrom("reconciliations")
        .where("transactionId", "=", data.id)
        .execute();
    }

    const updated = await tx
      .updateTable("transactions")
      .set(data)
      .where("id", "=", data.id)
      .returning(transactionListMapper)
      .executeTakeFirstOrThrow();

    return updated;
  });
}
