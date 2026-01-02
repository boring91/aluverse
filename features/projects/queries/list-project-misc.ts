import { listProjectItemSchema } from "../schemas/project-items.schema";
import { db } from "@/db";
import { projectMiscMapper } from "@/db/mappers";
import { z } from "zod";

export async function listProjectMisc(
  input: z.infer<typeof listProjectItemSchema>
) {
  const { projectId, pagination, sorting } = input;

  const baseQuery = db
    .selectFrom("projectMisc")
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
      case "amount":
        query = query.orderBy(`amount ${dir}`);
        break;
    }
  });

  query =
    pagination.pageSize === -1
      ? query
      : query
          .offset(pagination.pageIndex * pagination.pageSize)
          .limit(pagination.pageSize);

  const items = await query.select(projectMiscMapper).execute();

  return { items, count, filteredCount };
}
