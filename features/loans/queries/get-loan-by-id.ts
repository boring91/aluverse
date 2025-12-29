import { db } from "@/db";
import { loanMapper } from "@/db/mappers"

export async function getLoanById(id: string) {
    return await db
        .selectFrom("loans")
        .where("id", "=", id)
        .select(loanMapper)
        .executeTakeFirst();
}
