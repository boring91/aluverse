import { db } from "@/db";
import { consolidationListMapper } from "@/shared/mappers/consolidations/consolidation-list.mapper";

export async function getConsolidationByIdQuery(id: string) {
  return await db
    .selectFrom("consolidations")
    .where("id", "=", id)
    .select(consolidationListMapper)
    .executeTakeFirst();
}
