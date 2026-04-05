import { db } from "@/db";
import { gstPaymentListMapper } from "@/shared/mappers/gst/gst-payment-list.mapper";

export async function getGstPaymentByIdQuery(id: string) {
  return await db
    .selectFrom("gstPayments")
    .where("id", "=", id)
    .select(gstPaymentListMapper)
    .executeTakeFirst();
}
