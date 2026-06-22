import type { z } from "zod";
import type { listGstPaymentSchema } from "../schemas/gst.shared-schema";
import { db } from "@/db";
import { gstPaymentListMapper } from "@/shared/mappers/gst/gst-payment-list.mapper";

export async function listGstPaymentsQuery(
  input: z.infer<typeof listGstPaymentSchema>,
) {
  const { filters, sorting, pagination } = input;

  const baseQuery = db.selectFrom("gstPayments");
  let query = baseQuery;

  if (filters?.from) {
    query = query.where("periodFrom", ">=", filters.from);
  }

  if (filters?.to) {
    query = query.where("periodTo", "<=", filters.to);
  }

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
      case "periodFrom":
        query = query.orderBy("periodFrom", dir);
        break;
      case "amount":
        query = query.orderBy("amount", dir);
        break;
    }
  });

  if (!sorting?.length) {
    query = query.orderBy("periodFrom", "desc");
  }

  query =
    pagination.pageSize === -1
      ? query
      : query
          .offset(pagination.pageIndex * pagination.pageSize)
          .limit(pagination.pageSize);

  const items = await query.select(gstPaymentListMapper).execute();

  return { items, count, filteredCount };
}
