import { db } from "@/db";

export async function deleteLoan(id: string) {
    return await db.deleteFrom("loans").where("id", "=", id).execute();
}
