import { z } from "zod";
import { db } from "@/db";
import { transactionMapper } from "@/db/mappers";
import { updateTransactionSchema } from "../schemas/transactions.schema";

export async function updateTransaction(
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

    // If the amount is being updated and actually changed, remove associated consolidations
    if (data.amount !== oldTransaction.amount) {
      await tx
        .deleteFrom("consolidations")
        .where("transactionId", "=", data.id)
        .execute();
    }

    const updated = await tx
      .updateTable("transactions")
      .set(data)
      .where("id", "=", data.id)
      .returning(transactionMapper)
      .executeTakeFirstOrThrow();

    return updated;
  });
}
