import { db } from "@/db";
import { reconciledAmount } from "@/shared/expressions/transactions/transaction.expression";
import { pendingReconciliationCountMapper } from "@/shared/mappers/reconciliations/reconciliation-transaction.mapper";

export async function getReconciliationStatisticsQuery() {
  const pendingReconciliationCount = (
    await db
      .selectFrom("transactions")
      .where((eb) => eb("amount", "!=", reconciledAmount))
      .select(pendingReconciliationCountMapper)
      .executeTakeFirstOrThrow()
  ).count;

  return { pendingReconciliationCount };
}
