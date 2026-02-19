import { listProjectItemSchema } from "../schemas/project-items.shared-schema";
import { db } from "@/db";
import {
  projectPaymentCountMapper,
  projectPaymentListMapper,
} from "@/shared/mappers/projects/project-payment-list.mapper";
import { z } from "zod";

export async function listProjectPaymentsQuery(
  input: z.infer<typeof listProjectItemSchema>
) {
  const { projectId, pagination, sorting } = input;

  const baseQuery = db
    .selectFrom("projectPayments")
    .where("projectId", "=", projectId);
  let query = baseQuery;

  const [count, filteredCount] = await Promise.all([
    baseQuery
      .select(projectPaymentCountMapper)
      .executeTakeFirstOrThrow()
      .then((x) => x.count),
    query
      .select(projectPaymentCountMapper)
      .executeTakeFirstOrThrow()
      .then((x) => x.count),
  ]);

  sorting?.forEach((sort) => {
    const dir = sort.desc ? "desc" : "asc";
    switch (sort.id) {
      case "date":
        query = query.orderBy(`date ${dir}`);
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

  const items = await query.select(projectPaymentListMapper).execute();

  return { items, count, filteredCount };
}
