import { db } from "@/db";
import { consolidatedAmount } from "@/db/expressions";
import { pendingConsolidationCountMapper } from "@/shared/mappers/consolidations/consolidation-transaction.mapper";

export async function getConsolidationStatisticsQuery() {
  const pendingConsolidationCount = (
    await db
      .selectFrom("transactions")
      .where((eb) => eb("amount", "!=", consolidatedAmount))
      .select(pendingConsolidationCountMapper)
      .executeTakeFirstOrThrow()
  ).count;

  return { pendingConsolidationCount };
}
