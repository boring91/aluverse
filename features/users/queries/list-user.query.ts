import { db } from "@/db";
import { userListMapper } from "@/shared/mappers/users/user-list.mapper";
import { z } from "zod";
import { listUsersSchema } from "../schemas/users.shared-schema";

export async function listUserQuery(data: z.infer<typeof listUsersSchema>) {
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
      .select((x) => x.fn.count<number>("users.id").as("count"))
      .executeTakeFirstOrThrow()
      .then((x) => x.count),
    query
      .select((x) => x.fn.count<number>("users.id").as("count"))
      .executeTakeFirstOrThrow()
      .then((x) => x.count),
  ]);

  query = query.orderBy("users.createdAt", "desc");

  query =
    pagination.pageSize === -1
      ? query
      : query
          .offset(pagination.pageSize * pagination.pageIndex)
          .limit(pagination.pageSize);

  const items = await query.select(userListMapper).execute();

  return { items, count, filteredCount };
}
