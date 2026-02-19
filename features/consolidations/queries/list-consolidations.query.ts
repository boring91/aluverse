import { listConsolidationSchema } from "../schemas/consolidations.shared-schema";
import { z } from "zod";
import { db } from "@/db";
import {
  consolidationCountMapper,
  consolidationListMapper,
} from "@/shared/mappers/consolidations/consolidation-list.mapper";

export async function listConsolidationsQuery(
  input: z.infer<typeof listConsolidationSchema>
) {
  const { transactionId, pagination } = input;

  const baseQuery = db
    .selectFrom("consolidations")
    .where("transactionId", "=", transactionId);

  let query = baseQuery;

  const [count, filteredCount] = await Promise.all([
    baseQuery
      .select(consolidationCountMapper)
      .executeTakeFirstOrThrow()
      .then((x) => x.count),
    query
      .select(consolidationCountMapper)
      .executeTakeFirstOrThrow()
      .then((x) => x.count),
  ]);

  query =
    pagination.pageSize === -1
      ? query
      : query
          .offset(pagination.pageIndex * pagination.pageSize)
          .limit(pagination.pageSize);

  const items = await query.select(consolidationListMapper).execute();

  return { items, count, filteredCount };
}
