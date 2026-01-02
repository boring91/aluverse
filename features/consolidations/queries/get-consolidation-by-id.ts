import { db } from "@/db";
import { consolidationMapper } from "@/db/mappers";

export async function getConsolidationById(id: string) {
  return await db
    .selectFrom("consolidations")
    .where("id", "=", id)
    .select(consolidationMapper)
    .executeTakeFirst();
}
