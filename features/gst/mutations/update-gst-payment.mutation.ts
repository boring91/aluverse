import { z } from "zod";
import { db } from "@/db";
import { updateGstPaymentSchema } from "../schemas/gst.shared-schema";

export async function updateGstPaymentMutation(
  data: z.infer<typeof updateGstPaymentSchema>
) {
  return await db
    .updateTable("gstPayments")
    .set(data)
    .where("id", "=", data.id)
    .returning(["id"])
    .executeTakeFirstOrThrow();
}
