import { listProjectItemSchema } from "../schemas/project-items.shared-schema";
import { db } from "@/db";
import {
  projectSupplyCountMapper,
  projectSupplyListMapper,
} from "@/shared/mappers/projects/project-supply-list.mapper";
import { z } from "zod";

export async function listProjectSuppliesQuery(
  input: z.infer<typeof listProjectItemSchema>
) {
  const { projectId, pagination, sorting } = input;

  const baseQuery = db
    .selectFrom("projectSupplies")
    .where("projectId", "=", projectId);
  let query = baseQuery;

  const [count, filteredCount] = await Promise.all([
    baseQuery
      .select(projectSupplyCountMapper)
      .executeTakeFirstOrThrow()
      .then((x) => x.count),
    query
      .select(projectSupplyCountMapper)
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

  const items = await query.select(projectSupplyListMapper).execute();

  return { items, count, filteredCount };
}
