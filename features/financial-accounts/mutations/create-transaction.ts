import { z } from "zod";
import { db } from "@/db";
import { transactionMapper } from "@/db/mappers"
import { createTransactionWithAccountIdSchema } from "../schemas/transactions.schema";

export async function createTransaction(
    data: z.infer<typeof createTransactionWithAccountIdSchema>
) {
    return await db
        .insertInto("transactions")
        .values(data)
        .returning(transactionMapper)
        .executeTakeFirstOrThrow();
}
