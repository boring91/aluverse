import { db } from "@/db";

export async function deleteFinancialAccount(id: string) {
  return await db
    .deleteFrom("financialAccounts")
    .where("id", "=", id)
    .returning(["id"])
    .executeTakeFirstOrThrow();
}
