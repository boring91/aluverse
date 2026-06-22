import type { z } from "zod";
import { db } from "@/db";
import { budgetCategoryAllocationListMapper } from "@/shared/mappers/budget/budget-category-allocation-list.mapper";
import type { listBudgetCategoryAllocationSchema } from "../schemas/budgets.shared-schema";

export async function listBudgetCategoryAllocationsQuery(
  input: z.infer<typeof listBudgetCategoryAllocationSchema>,
) {
  const { budgetCategoryId, pagination, sorting } = input;

  const baseQuery = db
    .selectFrom("budgetCategoryAllocations")
    .where("budgetCategoryId", "=", budgetCategoryId);
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

  sorting?.forEach((sort) => {
    const dir = sort.desc ? "desc" : "asc";
    switch (sort.id) {
      case "effectiveDate":
        query = query.orderBy("effectiveDate", dir);
        break;
      case "amount":
        query = query.orderBy("amount", dir);
        break;
    }
  });

  query =
    pagination.pageSize === -1
      ? query
      : query
          .offset(pagination.pageIndex * pagination.pageSize)
          .limit(pagination.pageSize);

  const items = await query
    .select(budgetCategoryAllocationListMapper)
    .execute();

  return { items, count, filteredCount };
}
