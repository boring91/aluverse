import { db } from "@/db";
import { z } from "zod";
import { roleListMapper } from "@/shared/mappers/rbac/role-list.mapper";
import { listRolesSchema } from "../schemas/rbac.shared-schema";

export async function listRolesQuery(data: z.infer<typeof listRolesSchema>) {
  const baseQuery = db.selectFrom("roles");

  let query = baseQuery;

  const { filters, pagination } = data;

  if (filters?.keyword) {
    const pattern = `%${filters.keyword}%`;
    query = query.where((eb) =>
      eb.or([
        eb("roles.name", "ilike", pattern),
        eb("roles.humanId", "ilike", pattern),
        eb("roles.description", "ilike", pattern),
      ])
    );
  }

  const [count, filteredCount] = await Promise.all([
    baseQuery
      .select((eb) => eb.fn.count<number>("roles.id").as("count"))
      .executeTakeFirstOrThrow()
      .then((x) => x.count),
    query
      .select((eb) => eb.fn.count<number>("roles.id").as("count"))
      .executeTakeFirstOrThrow()
      .then((x) => x.count),
  ]);

  query = query.orderBy("roles.isBuiltIn", "desc").orderBy("roles.name", "asc");

  query =
    pagination.pageSize === -1
      ? query
      : query
          .offset(pagination.pageSize * pagination.pageIndex)
          .limit(pagination.pageSize);

  const items = await query.select(roleListMapper).execute();

  return { items, count, filteredCount };
}
