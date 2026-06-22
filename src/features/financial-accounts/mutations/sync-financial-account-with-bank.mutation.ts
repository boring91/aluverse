import { db } from "@/db";
import { syncWithBank } from "../lib/bank-syncer";

export async function syncFinancialAccountWithBankMutation(id: string) {
  const account = await db
    .selectFrom("financialAccounts")
    .where("id", "=", id)
    .select(["syncWithBank"])
    .executeTakeFirstOrThrow();

  if (!account.syncWithBank) {
    return 0;
  }

  return await syncWithBank(account.syncWithBank, id);
}
