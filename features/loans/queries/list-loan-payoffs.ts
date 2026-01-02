import { db } from "@/db";
import { loanPayoffMapper } from "@/db/mappers";
import { listLoanPayoffSchema } from "../schemas/loan-payoffs.schema";
import { z } from "zod";

export async function listLoanPayoffs(
  input: z.infer<typeof listLoanPayoffSchema>
) {
  const { loanId, pagination, sorting } = input;

  const baseQuery = db.selectFrom("loanPayoffs").where("loanId", "=", loanId);
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

  const items = await query.select(loanPayoffMapper).execute();

  return { items, count, filteredCount };
}
