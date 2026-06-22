import type { z } from "zod";
import { db } from "@/db";
import { financialAccountListMapper } from "@/shared/mappers/financial-accounts/financial-account-list.mapper";
import type { createFinancialAccountSchema } from "../schemas/financial-accounts.shared-schema";

export async function createFinancialAccountMutation(
  data: z.infer<typeof createFinancialAccountSchema>,
) {
  return await db
    .insertInto("financialAccounts")
    .values(data)
    .returning(financialAccountListMapper)
    .executeTakeFirstOrThrow();
}
