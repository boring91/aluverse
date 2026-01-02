import { listProjectItemSchema } from "../schemas/project-items.schema";
import { db } from "@/db";
import { projectSupplyMapper } from "@/db/mappers";
import { z } from "zod";

export async function listProjectSupplies(
  input: z.infer<typeof listProjectItemSchema>
) {
  const { projectId, pagination, sorting } = input;

  const baseQuery = db
    .selectFrom("projectSupplies")
    .where("projectId", "=", projectId);
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

  sorting?.forEach((sort) => {
    const dir = sort.desc ? "desc" : "asc";
    switch (sort.id) {
      case "name":
        query = query.orderBy(`name ${dir}`);
        break;
      case "quantity":
        query = query.orderBy(`quantity ${dir}`);
        break;
      case "unitPrice":
        query = query.orderBy(`unitPrice ${dir}`);
        break;
    }
  });

  query =
    pagination.pageSize === -1
      ? query
      : query
          .offset(pagination.pageIndex * pagination.pageSize)
          .limit(pagination.pageSize);

  const items = await query.select(projectSupplyMapper).execute();

  return { items, count, filteredCount };
}
