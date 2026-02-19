import { z } from "zod";
import { db } from "@/db";
import { transactionListMapper } from "@/shared/mappers/transactions/transaction-list.mapper";
import { createTransactionWithAccountIdSchema } from "../schemas/transactions.shared-schema";

export async function createTransactionMutation(
  data: z.infer<typeof createTransactionWithAccountIdSchema>
) {
  return await db
    .insertInto("transactions")
    .values(data)
    .returning(transactionListMapper)
    .executeTakeFirstOrThrow();
}
