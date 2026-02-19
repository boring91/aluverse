import { z } from "zod";
import { db } from "@/db";
import { listTransactionSchema } from "../schemas/transactions.shared-schema";
import {
  hasBudgetCategory,
  hasConsolidationGroup,
  hasGst,
  hasProject,
  isTransactionConsolidated,
} from "@/shared/expressions/transactions/transaction.expression";
import {
  transactionCountMapper,
  transactionListMapper,
} from "@/shared/mappers/transactions/transaction-list.mapper";

export async function listTransactionsQuery(
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
    query = query.where((eb) => eb("amount", ">=", filters.fromAmount!));
  }

  if (filters?.toAmount !== undefined) {
    query = query.where((eb) => eb("amount", "<", filters.toAmount!));
  }

  if (filters?.isConsolidated !== undefined) {
    query = query.where((eb) =>
      eb(isTransactionConsolidated(eb), "=", filters.isConsolidated!)
    );
  }

  if (filters?.hasGst !== undefined) {
    query = query.where((eb) => eb(hasGst(eb), "=", filters.hasGst!));
  }

  if (filters?.consolidationGroup) {
    query = query.where((eb) =>
      eb(hasConsolidationGroup(eb, filters.consolidationGroup!), "=", true)
    );
  }

  if (filters?.budgetCategory) {
    query = query.where((eb) =>
      eb(hasBudgetCategory(eb, filters.budgetCategory!), "=", true)
    );
  }

  if (filters?.projectId) {
    query = query.where((eb) =>
      eb(hasProject(eb, filters.projectId!), "=", true)
    );
  }

  const [count, filteredCount] = await Promise.all([
    baseQuery
      .select(transactionCountMapper)
      .executeTakeFirstOrThrow()
      .then((x) => x.count),
    query
      .select(transactionCountMapper)
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
        query = query.orderBy("amount", dir);
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

  const items = await query.select(transactionListMapper).execute();

  return { items, count, filteredCount };
}
