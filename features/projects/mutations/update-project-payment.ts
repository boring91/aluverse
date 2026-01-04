import { z } from "zod";
import { db } from "@/db";
import { updateProjectPaymentSchema } from "../schemas/project-items.schema";

export async function updateProjectPayment(
  data: z.infer<typeof updateProjectPaymentSchema>
) {
  return await db.transaction().execute(async (tx) => {
    // Get the current payment to check for consolidationId and current amount
    const payment = await tx
      .selectFrom("projectPayments")
      .select(["consolidationId", "amount"])
      .where("id", "=", data.id)
      .executeTakeFirstOrThrow();

    // Only delete consolidation if amount has changed
    const amountChanged = data.amount !== payment.amount;

    if (payment.consolidationId && amountChanged) {
      await tx
        .deleteFrom("consolidations")
        .where("id", "=", payment.consolidationId)
        .execute();
    }

    // Update the payment
    return await tx
      .updateTable("projectPayments")
      .set(data)
      .where("id", "=", data.id)
      .returning(["id"])
      .executeTakeFirstOrThrow();
  });
}
