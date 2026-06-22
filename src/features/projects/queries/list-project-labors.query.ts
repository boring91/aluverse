import type { z } from "zod";
import type { listProjectItemSchema } from "../schemas/project-items.shared-schema";
import { db } from "@/db";
import { projectLaborListMapper } from "@/shared/mappers/projects/project-labor-list.mapper";

export async function listProjectLaborsQuery(
  input: z.infer<typeof listProjectItemSchema>,
) {
  const { projectId, pagination, sorting } = input;

  const baseQuery = db
    .selectFrom("projectLabors")
    .where("projectId", "=", projectId);
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
      case "name":
        query = query.orderBy(`name ${dir}`);
        break;
      case "hours":
        query = query.orderBy(`hours ${dir}`);
        break;
      case "rate":
        query = query.orderBy(`rate ${dir}`);
        break;
    }
  });

  query =
    pagination.pageSize === -1
      ? query
      : query
          .offset(pagination.pageIndex * pagination.pageSize)
          .limit(pagination.pageSize);

  const items = await query.select(projectLaborListMapper).execute();

  return { items, count, filteredCount };
}
