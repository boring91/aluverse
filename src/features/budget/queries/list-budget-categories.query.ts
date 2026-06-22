import type { z } from "zod";
import type { listBudgetCategorySchema } from "../schemas/budgets.shared-schema";
import { db } from "@/db";
import { budgetCategoryListMapper } from "@/shared/mappers/budget/budget-category-list.mapper";

export async function listBudgetCategoriesQuery(
  input: z.infer<typeof listBudgetCategorySchema>,
) {
  const baseQuery = db.selectFrom("budgetCategories");
  let query = baseQuery;

  const { filters, pagination } = input;

  if (filters?.keyword) {
    query = query.where("name", "ilike", `%${filters.keyword}%`);
  }

  if (filters?.includingGst !== undefined) {
    query = query.where("includingGst", "=", filters.includingGst);
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

  query = query.orderBy("name");

  query =
    pagination.pageSize === -1
      ? query
      : query
          .offset(pagination.pageIndex * pagination.pageSize)
          .limit(pagination.pageSize);

  const items = await query.select(budgetCategoryListMapper).execute();

  return { items, count, filteredCount };
}
