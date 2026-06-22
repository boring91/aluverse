import { db } from "@/db";
import { loanListMapper } from "@/shared/mappers/loans/loan-list.mapper";

export async function getLoanByIdQuery(id: string) {
  return await db
    .selectFrom("loans")
    .where("id", "=", id)
    .select(loanListMapper)
    .executeTakeFirst();
}
