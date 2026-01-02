import { db } from "@/db";
import { consolidatedAmount } from "@/db/expressions";

export async function getConsolidationStatistics() {
  const pendingConsolidationCount = (
    await db
      .selectFrom("transactions")
      .where((eb) => eb("amount", "!=", consolidatedAmount))
      .select((eb) => [eb.fn.count<number>("id").as("count")])
      .executeTakeFirstOrThrow()
  ).count;

  return { pendingConsolidationCount };
}
