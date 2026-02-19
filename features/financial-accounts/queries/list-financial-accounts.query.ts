import { db } from "@/db";
import { financialAccountListMapper } from "@/shared/mappers/financial-accounts/financial-account-list.mapper";

export async function listFinancialAccountsQuery() {
  return await db
    .selectFrom("financialAccounts")
    .select(financialAccountListMapper)
    .execute();
}
