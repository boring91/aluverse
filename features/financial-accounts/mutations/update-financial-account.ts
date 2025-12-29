import { z } from "zod";
import { db } from "@/db";
import { financialAccountMapper } from "@/db/mappers"
import { updateFinancialAccountSchema } from "../schemas/financial-account.schema";

export async function updateFinancialAccount(
    data: z.infer<typeof updateFinancialAccountSchema>
) {
    return await db
        .updateTable("financialAccounts")
        .set(data)
        .returning(financialAccountMapper)
        .executeTakeFirstOrThrow();
}
