import { listConsolidationSchema } from "@/features/consolidations";
import { z } from "zod";
import { db } from "@/db";
import { consolidationMapper } from "@/db/mappers";

export async function listConsolidations(
  input: z.infer<typeof listConsolidationSchema>
) {
  const { transactionId, pagination } = input;

  const baseQuery = db
    .selectFrom("consolidations")
    .where("transactionId", "=", transactionId);

  let query = baseQuery;

  const [count, filteredCount] = await Promise.all([
    baseQuery
      .select((x) => x.fn.count<number>("id").as("count"))
      .executeTakeFirstOrThrow()
      .then((x) => x.count),
    query
      .select((x) => x.fn.count<number>("id").as("count"))
      .executeTakeFirstOrThrow()
      .then((x) => x.count),
  ]);

  query =
    pagination.pageSize === -1
      ? query
      : query
          .offset(pagination.pageIndex * pagination.pageSize)
          .limit(pagination.pageSize);

  const items = await query.select(consolidationMapper).execute();

  return { items, count, filteredCount };
}
