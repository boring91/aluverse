import { db } from "@/db";
import { consolidationDefaultsMapper } from "@/shared/mappers/consolidations/consolidation-transaction.mapper";

export async function getConsolidationDefaultsQuery(transactionId: string) {
  return await db
    .selectFrom("transactions")
    .where("id", "=", transactionId)
    .select(consolidationDefaultsMapper)
    .executeTakeFirstOrThrow();
}
