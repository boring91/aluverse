import { z } from "zod";
import { listBudgetCategorySchema } from "../schemas/budgets.schema";
import { db } from "@/db";
import { budgetCategoryMapper } from "@/db/mappers/budgets.mapper";

export async function listBudgetCategories(
  input: z.infer<typeof listBudgetCategorySchema>
) {
  const baseQuery = db.selectFrom("budgetCategories");
  let query = baseQuery;

  const { filters, pagination } = input;

  if (filters?.keyword) {
    query = query.where((eb) =>
      eb.or([
        eb("name", "ilike", `%${filters.keyword}%`),
        eb("humanId", "ilike", `%${filters.keyword}%`),
      ])
    );
  }

  if (filters?.includingGst !== undefined) {
    query = query.where("includingGst", "=", filters.includingGst);
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

  query = query.orderBy("name");

  query =
    pagination.pageSize === -1
      ? query
      : query
          .offset(pagination.pageIndex * pagination.pageSize)
          .limit(pagination.pageSize);

  const items = await query.select(budgetCategoryMapper).execute();

  return { items, count, filteredCount };
}
