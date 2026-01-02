import { db } from "@/db";
import { consolidatedAmount } from "@/db/expressions";

export async function getConsolidationDefaults(transactionId: string) {
  return await db
    .selectFrom("transactions")
    .where("id", "=", transactionId)
    .select((eb) => [
      "description",
      eb("amount", "-", consolidatedAmount(eb)).as("remainingAmount"),
    ])
    .executeTakeFirstOrThrow();
}
