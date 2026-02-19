import { db } from "@/db";
import { projectPaymentListMapper } from "@/shared/mappers/projects/project-payment-list.mapper";

export async function getProjectPaymentByIdQuery(id: string) {
  return await db
    .selectFrom("projectPayments")
    .where("id", "=", id)
    .select(projectPaymentListMapper)
    .executeTakeFirst();
}
