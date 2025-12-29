import { z } from "zod";
import { db } from "@/db";
import { financialAccountMapper } from "@/db/mappers"
import { createFinancialAccountSchema } from "../schemas/financial-account.schema";

export async function createFinancialAccount(
    data: z.infer<typeof createFinancialAccountSchema>
) {
    return await db
        .insertInto("financialAccounts")
        .values(data)
        .returning(financialAccountMapper)
        .executeTakeFirstOrThrow();
}
