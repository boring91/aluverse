import { db } from "@/db";
import { projectSupplyListMapper } from "@/shared/mappers/projects/project-supply-list.mapper";

export async function getProjectSupplyByIdQuery(id: string) {
  return await db
    .selectFrom("projectSupplies")
    .where("id", "=", id)
    .select(projectSupplyListMapper)
    .executeTakeFirst();
}
