import { z } from "zod";
import { db } from "@/db";
import { createGstPaymentSchema } from "../schemas/gst.shared-schema";

export async function createGstPaymentMutation(
  data: z.infer<typeof createGstPaymentSchema>
) {
  return await db
    .insertInto("gstPayments")
    .values(data)
    .returning(["id"])
    .executeTakeFirstOrThrow();
}
