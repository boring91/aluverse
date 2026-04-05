import { db } from "@/db";

export async function deleteGstPaymentMutation(id: string) {
  return await db.transaction().execute(async (tx) => {
    const payment = await tx
      .selectFrom("gstPayments")
      .select(["id", "reconciliationId"])
      .where("id", "=", id)
      .executeTakeFirstOrThrow();

    if (payment.reconciliationId) {
      await tx
        .deleteFrom("reconciliations")
        .where("id", "=", payment.reconciliationId)
        .execute();
    }

    return await tx
      .deleteFrom("gstPayments")
      .where("id", "=", id)
      .returning(["id", "reconciliationId"])
      .executeTakeFirstOrThrow();
  });
}
