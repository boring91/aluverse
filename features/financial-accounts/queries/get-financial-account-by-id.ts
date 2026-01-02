import { db } from "@/db";
import { financialAccountMapper } from "@/db/mappers";

export async function getFinancialAccountById(id: string) {
  return await db
    .selectFrom("financialAccounts")
    .where("id", "=", id)
    .select(financialAccountMapper)
    .executeTakeFirst();
}
