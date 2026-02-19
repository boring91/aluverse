import { db } from "@/db";
import { z } from "zod";
import { roleFullMapper } from "../mappers/role-full.mapper";
import { listRolesSchema } from "../schemas/rbac.schema";

export async function listRoles(data: z.infer<typeof listRolesSchema>) {
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
      .select((x) => x.fn.count<number>("roles.id").as("count"))
      .executeTakeFirstOrThrow()
      .then((x) => x.count),
    query
      .select((x) => x.fn.count<number>("roles.id").as("count"))
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

  const items = await query.select(roleFullMapper).execute();

  return { items, count, filteredCount };
}
