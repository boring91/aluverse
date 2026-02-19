import { db } from "@/db";

export async function deleteProjectPaymentMutation(id: string) {
  return await db.transaction().execute(async (tx) => {
    const payment = await db
      .deleteFrom("projectPayments")
      .where("id", "=", id)
      .returning(["id", "consolidationId"])
      .executeTakeFirstOrThrow();

    if (!payment.consolidationId) return payment;

    await tx
      .deleteFrom("consolidations")
      .where("id", "=", payment.consolidationId)
      .execute();

    return payment;
  });
}
