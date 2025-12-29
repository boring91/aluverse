import { db } from "@/db";
import { projectLaborMapper } from "@/db/mappers"

export async function getProjectLaborById(id: string) {
    return await db
        .selectFrom("projectLabors")
        .where("id", "=", id)
        .select(projectLaborMapper)
        .executeTakeFirst();
}
