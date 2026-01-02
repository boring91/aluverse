import { db } from "@/db";
import { financialAccountMapper } from "@/db/mappers";

export async function listFinancialAccounts() {
  return await db
    .selectFrom("financialAccounts")
    .select(financialAccountMapper)
    .execute();
}
