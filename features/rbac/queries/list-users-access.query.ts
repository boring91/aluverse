import { db } from "@/db";
import { z } from "zod";
import { userAccessMapper } from "@/shared/mappers/rbac/user-access.mapper";
import { listUsersAccessSchema } from "../schemas/rbac.shared-schema";

export async function listUsersAccessQuery(
  data: z.infer<typeof listUsersAccessSchema>
) {
  const baseQuery = db.selectFrom("users");

  let query = baseQuery;

  const { filters, pagination } = data;

  if (filters?.keyword) {
    const pattern = `%${filters.keyword}%`;
    query = query.where((eb) =>
      eb.or([
        eb("users.name", "ilike", pattern),
        eb("users.email", "ilike", pattern),
      ])
    );
  }

  const [count, filteredCount] = await Promise.all([
    baseQuery
      .select((eb) => eb.fn.count<number>("users.id").as("count"))
      .executeTakeFirstOrThrow()
      .then((x) => x.count),
    query
      .select((eb) => eb.fn.count<number>("users.id").as("count"))
      .executeTakeFirstOrThrow()
      .then((x) => x.count),
  ]);

  query = query.orderBy("users.name", "asc");

  query =
    pagination.pageSize === -1
      ? query
      : query
          .offset(pagination.pageSize * pagination.pageIndex)
          .limit(pagination.pageSize);

  const items = await query.select(userAccessMapper).execute();

  return { items, count, filteredCount };
}
