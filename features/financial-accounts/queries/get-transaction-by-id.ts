import { db } from "@/db";
import { transactionMapper } from "@/db/mappers";

export async function getTransactionById(id: string) {
  return await db
    .selectFrom("transactions")
    .where("id", "=", id)
    .select(transactionMapper)
    .executeTakeFirst();
}
