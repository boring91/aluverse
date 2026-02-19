import { z } from "zod";
import { listLoanSchema } from "../schemas/loans.shared-schema";
import { db } from "@/db";
import { loanRemaining } from "@/shared/expressions/loans/loan.expression";
import { loanListMapper } from "@/shared/mappers/loans/loan-list.mapper";

export async function listLoansQuery(input: z.infer<typeof listLoanSchema>) {
  const { filters, sorting, pagination } = input;

  const baseQuery = db.selectFrom("loans");
  let query = baseQuery;

  if (filters?.keyword) {
    query = query.where("partyName", "ilike", `%${filters.keyword}%`);
  }

  if (filters?.type) {
    query = query.where("type", "=", filters.type);
  }

  if (filters?.isPaidOff !== undefined) {
    query = query.where(loanRemaining, filters.isPaidOff ? "=" : "!=", 0);
  }

  if (filters?.from) {
    query = query.where("date", ">=", filters.from);
  }

  if (filters?.to) {
    query = query.where("date", "<=", filters.to);
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
      case "partyName":
        query = query.orderBy(`partyName ${dir}`);
        break;
      case "amount":
        query = query.orderBy(`amount ${dir}`);
        break;
      case "date":
        query = query.orderBy(`date ${dir}`);
        break;
      case "dueDate":
        query = query.orderBy(`dueDate ${dir}`);
        break;
    }
  });

  query =
    pagination.pageSize === -1
      ? query
      : query
          .offset(pagination.pageIndex * pagination.pageSize)
          .limit(pagination.pageSize);

  const items = await query.select(loanListMapper).execute();

  return { items, count, filteredCount };
}
