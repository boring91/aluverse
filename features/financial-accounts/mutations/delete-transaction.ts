import { db } from "@/db";
import { transactionMapper } from "@/db/mappers";

export async function deleteTransaction(id: string) {
  return await db
    .deleteFrom("transactions")
    .where("id", "=", id)
    .returning(transactionMapper)
    .executeTakeFirstOrThrow();
}
