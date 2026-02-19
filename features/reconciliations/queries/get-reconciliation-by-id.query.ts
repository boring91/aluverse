import { db } from "@/db";
import { reconciliationListMapper } from "@/shared/mappers/reconciliations/reconciliation-list.mapper";

export async function getReconciliationByIdQuery(id: string) {
  return await db
    .selectFrom("reconciliations")
    .where("id", "=", id)
    .select(reconciliationListMapper)
    .executeTakeFirst();
}
