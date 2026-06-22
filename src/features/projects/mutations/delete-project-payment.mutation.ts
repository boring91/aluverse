import { db } from "@/db";

export async function deleteProjectPaymentMutation(id: string) {
  return await db.transaction().execute(async (tx) => {
    const payment = await db
      .deleteFrom("projectPayments")
      .where("id", "=", id)
      .returning(["id", "reconciliationId"])
      .executeTakeFirstOrThrow();

    if (!payment.reconciliationId) return payment;

    await tx
      .deleteFrom("reconciliations")
      .where("id", "=", payment.reconciliationId)
      .execute();

    return payment;
  });
}
