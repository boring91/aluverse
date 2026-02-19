import { db } from "@/db";
import { transactionListMapper } from "@/shared/mappers/transactions/transaction-list.mapper";

export async function deleteTransactionMutation(id: string) {
  return await db
    .deleteFrom("transactions")
    .where("id", "=", id)
    .returning(transactionListMapper)
    .executeTakeFirstOrThrow();
}
