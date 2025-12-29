import { db } from "@/db";

export async function deleteProjectLabor(id: string) {
    return await db
        .deleteFrom("projectLabors")
        .where("id", "=", id)
        .returning(["id"])
        .executeTakeFirstOrThrow();
}
