import { db } from "@/db";
import { transactionListMapper } from "@/shared/mappers/transactions/transaction-list.mapper";

export async function getTransactionByIdQuery(id: string) {
  return await db
    .selectFrom("transactions")
    .where("id", "=", id)
    .select(transactionListMapper)
    .executeTakeFirst();
}
