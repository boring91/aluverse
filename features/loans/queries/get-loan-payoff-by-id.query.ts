import { db } from "@/db";
import { loanPayoffListMapper } from "@/shared/mappers/loans/loan-payoff-list.mapper";

export async function getLoanPayoffByIdQuery(id: string) {
  return await db
    .selectFrom("loanPayoffs")
    .where("id", "=", id)
    .select(loanPayoffListMapper)
    .executeTakeFirst();
}
