import { db } from "@/db";
import { projectSupplyMapper } from "@/db/mappers";

export async function getProjectSupplyById(id: string) {
  return await db
    .selectFrom("projectSupplies")
    .where("id", "=", id)
    .select(projectSupplyMapper)
    .executeTakeFirst();
}
