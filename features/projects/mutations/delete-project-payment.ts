import { db } from "@/db";

export async function deleteProjectPayment(id: string) {
    return await db
        .deleteFrom("projectPayments")
        .where("id", "=", id)
        .returning(["id"])
        .executeTakeFirstOrThrow();
}
