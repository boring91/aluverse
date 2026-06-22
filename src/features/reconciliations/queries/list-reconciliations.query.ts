import type { z } from "zod";
import type { listReconciliationSchema } from "../schemas/reconciliations.shared-schema";
import { db } from "@/db";
import { reconciliationListMapper } from "@/shared/mappers/reconciliations/reconciliation-list.mapper";

export async function listReconciliationsQuery(
  input: z.infer<typeof listReconciliationSchema>,
) {
  const { transactionId, pagination } = input;

  const baseQuery = db
    .selectFrom("reconciliations")
    .where("transactionId", "=", transactionId);

  let query = baseQuery;

  const [count, filteredCount] = await Promise.all([
    baseQuery
      .select((eb) => eb.fn.count<number>("id").as("count"))
      .executeTakeFirstOrThrow()
      .then((x) => x.count),
    query
      .select((eb) => eb.fn.count<number>("id").as("count"))
      .executeTakeFirstOrThrow()
      .then((x) => x.count),
  ]);

  query =
    pagination.pageSize === -1
      ? query
      : query
          .offset(pagination.pageIndex * pagination.pageSize)
          .limit(pagination.pageSize);

  const items = await query.select(reconciliationListMapper).execute();

  return { items, count, filteredCount };
}
