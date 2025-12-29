import { db } from "@/db";

export async function deleteProjectMisc(id: string) {
    return await db
        .deleteFrom("projectMisc")
        .where("id", "=", id)
        .returning(["id"])
        .executeTakeFirstOrThrow();
}
