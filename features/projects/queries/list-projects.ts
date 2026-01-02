import { listProjectSchema } from "@/features/projects";
import { db } from "@/db";
import { projectPaid, unconsolidatedItemsCount } from "@/db/expressions";
import { projectMapper } from "@/db/mappers";
import { z } from "zod";

export async function listProjects(input: z.infer<typeof listProjectSchema>) {
  const baseQuery = db.selectFrom("projects");
  let query = baseQuery;

  const { filters, sorting, pagination } = input;

  if (filters?.keyword) {
    query = query.where((eb) =>
      eb.or([
        eb("client", "ilike", `%${filters.keyword}%`),
        eb("title", "ilike", `%${filters.keyword}%`),
      ])
    );
  }

  if (filters?.from) {
    query = query.where("startDate", ">=", filters.from);
  }

  if (filters?.to) {
    query = query.where("startDate", "<", filters.to);
  }

  if (filters?.isConsolidated !== undefined && filters.isConsolidated) {
    query = query.where((eb) => eb(unconsolidatedItemsCount, "=", 0));
  }

  if (filters?.isConsolidated !== undefined && !filters.isConsolidated) {
    query = query.where((eb) => eb(unconsolidatedItemsCount, ">", 0));
  }

  switch (filters?.status) {
    case "planning":
      query = query.where("startDate", "is", null);
      break;
    case "inProgress":
      query = query.where("startDate", "is not", null);
      query = query.where("endDate", "is", null);
      break;
    case "awaitingPayment":
      query = query.where("startDate", "is not", null);
      query = query.where("endDate", "is not", null);
      query = query.where(projectPaid, "!=", (x) => x.ref("price"));
      break;
    case "completed":
      query = query.where("startDate", "is not", null);
      query = query.where("endDate", "is not", null);
      query = query.where(projectPaid, "=", (x) => x.ref("price"));
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

  sorting?.forEach((sort) => {
    const dir = sort.desc ? "desc" : "asc";
    switch (sort.id) {
      case "humanId":
        query = query.orderBy(`humanId ${dir}`);
        break;
      case "price":
        query = query.orderBy(`price ${dir}`);
        break;
      case "visitDate":
        query = query.orderBy(`visitDate ${dir}`);
        break;
      case "startDate":
        query = query.orderBy(`startDate ${dir}`);
        break;
      case "endDate":
        query = query.orderBy(`endDate ${dir}`);
        break;
    }
  });

  if (!sorting?.length) {
    query = query.orderBy("startDate desc");
  }

  query =
    pagination.pageSize === -1
      ? query
      : query
          .offset(pagination.pageIndex * pagination.pageSize)
          .limit(pagination.pageSize);

  const items = await query.select(projectMapper).execute();

  return { items, count, filteredCount };
}
