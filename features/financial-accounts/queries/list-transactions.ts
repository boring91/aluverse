import { z } from "zod";
import { db } from "@/db";
import { listTransactionSchema } from "@/features/financial-accounts";
import { isTransactionConsolidated, signedAmount } from "@/db/expressions";
import { transactionMapper } from "@/db/mappers";

export async function listTransactions(
  input: z.infer<typeof listTransactionSchema>
) {
  const { accountId, filters, pagination, sorting } = input;

  const baseQuery = db
    .selectFrom("transactions")
    .$if(!!accountId, (qb) => qb.where("accountId", "=", accountId!));

  let query = baseQuery;

  if (filters?.keyword) {
    query = query.where("description", "ilike", `%${filters.keyword}%`);
  }

  if (filters?.from) {
    query = query.where("date", ">=", filters.from);
  }

  if (filters?.to) {
    query = query.where("date", "<=", filters.to);
  }

  if (filters?.fromAmount !== undefined) {
    query = query.where((eb) =>
      eb(signedAmount(eb), ">=", filters.fromAmount!)
    );
  }

  if (filters?.toAmount !== undefined) {
    query = query.where((eb) => eb(signedAmount(eb), "<", filters.toAmount!));
  }

  if (filters?.isConsolidated !== undefined && filters.isConsolidated) {
    query = query.where((eb) => isTransactionConsolidated(eb));
  }

  if (filters?.isConsolidated !== undefined && !filters.isConsolidated) {
    query = query.where((eb) => eb(isTransactionConsolidated(eb), "=", false));
  }

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

  sorting?.forEach((sort) => {
    const dir = sort.desc ? "desc" : "asc";
    switch (sort.id) {
      case "date":
        query = query.orderBy("date", dir);
        break;
      case "description":
        query = query.orderBy("description", dir);
        break;
      case "amount":
        query = query.orderBy((eb) => signedAmount(eb), dir);
        break;
    }
  });

  if (!sorting?.length) {
    query = query.orderBy("date", "desc");
  }

  query =
    pagination.pageSize === -1
      ? query
      : query
          .offset(pagination.pageIndex * pagination.pageSize)
          .limit(pagination.pageSize);

  const items = await query.select(transactionMapper).execute();

  return { items, count, filteredCount };
}
