import { z } from "zod";
import { db } from "@/db";
import { financialAccountListMapper } from "@/shared/mappers/financial-accounts/financial-account-list.mapper";
import { updateFinancialAccountSchema } from "../schemas/financial-accounts.shared-schema";

export async function updateFinancialAccountMutation(
  data: z.infer<typeof updateFinancialAccountSchema>
) {
  return await db
    .updateTable("financialAccounts")
    .set(data)
    .where("id", "=", data.id)
    .returning(financialAccountListMapper)
    .executeTakeFirstOrThrow();
}
