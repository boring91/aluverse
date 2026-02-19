import { z } from "zod";
import { db } from "@/db";
import { updateProjectPaymentSchema } from "../schemas/project-items.shared-schema";

export async function updateProjectPaymentMutation(
  data: z.infer<typeof updateProjectPaymentSchema>
) {
  return await db.transaction().execute(async (tx) => {
    // Get the current payment to check for reconciliationId and current amount
    const payment = await tx
      .selectFrom("projectPayments")
      .select(["reconciliationId", "amount"])
      .where("id", "=", data.id)
      .executeTakeFirstOrThrow();

    // Only delete reconciliation if amount has changed
    const amountChanged = data.amount !== payment.amount;

    if (payment.reconciliationId && amountChanged) {
      await tx
        .deleteFrom("reconciliations")
        .where("id", "=", payment.reconciliationId)
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
