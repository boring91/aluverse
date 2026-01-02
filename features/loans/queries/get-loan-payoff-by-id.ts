import { db } from "@/db";
import { loanPayoffMapper } from "@/db/mappers";

export async function getLoanPayoffById(id: string) {
  return await db
    .selectFrom("loanPayoffs")
    .where("id", "=", id)
    .select(loanPayoffMapper)
    .executeTakeFirst();
}
