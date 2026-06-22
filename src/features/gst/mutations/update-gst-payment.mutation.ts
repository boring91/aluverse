import type { z } from "zod";
import { db } from "@/db";
import type { updateGstPaymentSchema } from "../schemas/gst.shared-schema";

export async function updateGstPaymentMutation(
  data: z.infer<typeof updateGstPaymentSchema>,
) {
  return await db.transaction().execute(async (tx) => {
    const payment = await tx
      .selectFrom("gstPayments")
      .select(["reconciliationId", "amount"])
      .where("id", "=", data.id)
      .executeTakeFirstOrThrow();

    const amountChanged = data.amount !== payment.amount;

    if (payment.reconciliationId && amountChanged) {
      await tx
        .deleteFrom("reconciliations")
        .where("id", "=", payment.reconciliationId)
        .execute();
    }

    return await tx
      .updateTable("gstPayments")
      .set(data)
      .where("id", "=", data.id)
      .returning(["id"])
      .executeTakeFirstOrThrow();
  });
}
