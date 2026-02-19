import { listProjectSchema } from "../schemas/projects.shared-schema";
import { db } from "@/db";
import {
  projectAwaitingPayment,
  projectCompleted,
  projectInPlanning,
  projectInProgress,
  unconsolidatedItemsCount,
} from "@/shared/expressions/projects/project.expression";
import {
  projectCountMapper,
  projectListMapper,
} from "@/shared/mappers/projects/project-list.mapper";
import { z } from "zod";

export async function listProjectsQuery(
  input: z.infer<typeof listProjectSchema>
) {
  const baseQuery = db.selectFrom("projects");
  let query = baseQuery;

  const { filters, sorting, pagination } = input;

  if (filters?.keyword) {
    query = query.where((eb) =>
      eb.or([
        eb("humanId", "ilike", `%${filters.keyword}%`),
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
      query = query.where(projectInPlanning);
      break;
    case "inProgress":
      query = query.where(projectInProgress);
      break;
    case "awaitingPayment":
      query = query.where(projectAwaitingPayment);
      break;
    case "completed":
      query = query.where(projectCompleted);
  }

  const [count, filteredCount] = await Promise.all([
    baseQuery
      .select(projectCountMapper)
      .executeTakeFirstOrThrow()
      .then((x) => x.count),
    query
      .select(projectCountMapper)
      .executeTakeFirstOrThrow()
      .then((x) => x.count),
  ]);

  sorting?.forEach((sort) => {
    const dir = sort.desc ? "desc" : "asc";
    switch (sort.id) {
      case "humanId":
        query = query.orderBy("humanId", dir);
        break;
      case "price":
        query = query.orderBy("price", dir);
        break;
      case "visitDate":
        query = query.orderBy("visitDate", dir);
        break;
      case "startDate":
        query = query.orderBy("startDate", dir);
        break;
      case "endDate":
        query = query.orderBy("endDate", dir);
        break;
    }
  });

  if (!sorting?.length) {
    query = query.orderBy("createdAt", "desc");
  }

  query =
    pagination.pageSize === -1
      ? query
      : query
          .offset(pagination.pageIndex * pagination.pageSize)
          .limit(pagination.pageSize);

  const items = await query.select(projectListMapper).execute();

  return { items, count, filteredCount };
}
