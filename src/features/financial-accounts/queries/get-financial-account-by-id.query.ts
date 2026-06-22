import { db } from "@/db";
import { financialAccountListMapper } from "@/shared/mappers/financial-accounts/financial-account-list.mapper";

export async function getFinancialAccountByIdQuery(id: string) {
  return await db
    .selectFrom("financialAccounts")
    .where("id", "=", id)
    .select(financialAccountListMapper)
    .executeTakeFirst();
}
