import { db } from "@/db";
import { reconciliationDefaultsMapper } from "@/shared/mappers/reconciliations/reconciliation-transaction.mapper";

export async function getReconciliationDefaultsQuery(transactionId: string) {
  return await db
    .selectFrom("transactions")
    .where("id", "=", transactionId)
    .select(reconciliationDefaultsMapper)
    .executeTakeFirstOrThrow();
}
