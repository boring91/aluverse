import { db } from "@/db";

export async function deleteGstPaymentMutation(id: string) {
  return await db
    .deleteFrom("gstPayments")
    .where("id", "=", id)
    .returning(["id"])
    .executeTakeFirstOrThrow();
}
