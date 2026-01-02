import { z } from "zod";
import { db } from "@/db";
import { transactionMapper } from "@/db/mappers";
import { updateTransactionSchema } from "../schemas/transactions.schema";

export async function updateTransaction(
  data: z.infer<typeof updateTransactionSchema>
) {
  return await db
    .updateTable("transactions")
    .set(data)
    .where("id", "=", data.id)
    .returning(transactionMapper)
    .executeTakeFirstOrThrow();
}
