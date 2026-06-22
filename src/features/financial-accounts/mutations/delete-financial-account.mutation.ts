import { db } from "@/db";

export async function deleteFinancialAccountMutation(id: string) {
  return await db
    .deleteFrom("financialAccounts")
    .where("id", "=", id)
    .returning(["id"])
    .executeTakeFirstOrThrow();
}
