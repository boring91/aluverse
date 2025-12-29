import { db } from "@/db";

export async function deleteLoanPayoff(id: string) {
    return await db
        .deleteFrom("loanPayoffs")
        .where("id", "=", id)
        .returning(["id"])
        .executeTakeFirstOrThrow();
}
