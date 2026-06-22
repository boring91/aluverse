import type { z } from "zod";
import { db } from "@/db";
import type { listTransactionSchema } from "../schemas/transactions.shared-schema";
import {
  hasBudgetCategoryId,
  hasReconciliationGroup,
  hasGst,
  hasProject,
  isTransactionReconciled,
} from "@/shared/expressions/transactions/transaction.expression";
import { transactionListMapper } from "@/shared/mappers/transactions/transaction-list.mapper";

export async function listTransactionsQuery(
  input: z.infer<typeof listTransactionSchema>,
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

  if (filters?.isReconciled !== undefined) {
    query = query.where((eb) =>
      eb(isTransactionReconciled(eb), "=", filters.isReconciled!),
    );
  }

  if (filters?.hasGst !== undefined) {
    query = query.where((eb) => eb(hasGst(eb), "=", filters.hasGst!));
  }

  if (filters?.reconciliationGroup) {
    query = query.where((eb) =>
      eb(hasReconciliationGroup(eb, filters.reconciliationGroup!), "=", true),
    );
  }

  if (filters?.budgetCategoryId) {
    query = query.where((eb) =>
      eb(hasBudgetCategoryId(eb, filters.budgetCategoryId!), "=", true),
    );
  }

  if (filters?.projectId) {
    query = query.where((eb) =>
      eb(hasProject(eb, filters.projectId!), "=", true),
    );
  }

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
