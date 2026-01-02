import { db } from "@/db";
import { projectPaymentMapper } from "@/db/mappers";

export async function getProjectPaymentById(id: string) {
  return await db
    .selectFrom("projectPayments")
    .where("id", "=", id)
    .select(projectPaymentMapper)
    .executeTakeFirst();
}
