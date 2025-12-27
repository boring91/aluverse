import {
    and,
    asc,
    count,
    desc,
    eq,
    SQL,
    sql,
    sum,
    gte,
    lte,
    ilike,
} from "drizzle-orm";
import { db, loans, loanPayoffs } from "@/db";
import { listLoanSchema } from "../schemas/loan.schema";
import { z } from "zod";
import { createLoanSchema, updateLoanSchema } from "../schemas/loan.schema";

const payoffsSq = db
    .select({
        loanId: loanPayoffs.loanId,
        total: sum(loanPayoffs.amount).as("payoffTotal"),
    })
    .from(loanPayoffs)
    .groupBy(loanPayoffs.loanId)
    .as("payoffsSq");

const projection = {
    id: loans.id,
    type: loans.type,
    partyName: loans.partyName,
    amount: loans.amount,
    date: loans.date,
    dueDate: loans.dueDate,
    notes: loans.notes,
    paid: sql<number>`COALESCE(SUM(${payoffsSq.total}), 0)`,
    remaining: sql<number>`${loans.amount} - COALESCE(SUM(${payoffsSq.total}), 0)`,
} as const;

export class LoanService {
    async list(input: z.infer<typeof listLoanSchema>) {
        const { pagination, sorting, filters: filterInput } = input;

        const whereFilters: SQL[] = [];
        const havingFilters: SQL[] = [];

        if (filterInput) {
            if (filterInput.keyword) {
                whereFilters.push(
                    ilike(loans.partyName, "%" + filterInput.keyword + "%")
                );
            }

            if (filterInput.type) {
                whereFilters.push(eq(loans.type, filterInput.type));
            }

            if (filterInput.isPaidOff !== undefined) {
                if (filterInput.isPaidOff) {
                    // Paid off: remaining = 0
                    havingFilters.push(
                        sql`${loans.amount} - COALESCE(SUM(${payoffsSq.total}), 0) = 0`
                    );
                } else {
                    // Not paid off: remaining > 0
                    havingFilters.push(
                        sql`${loans.amount} - COALESCE(SUM(${payoffsSq.total}), 0) > 0`
                    );
                }
            }

            if (filterInput.from) {
                whereFilters.push(gte(loans.date, filterInput.from));
            }

            if (filterInput.to) {
                whereFilters.push(lte(loans.date, filterInput.to));
            }
        }

        const orderBy: SQL[] = [];
        sorting?.forEach(sort => {
            const direction = sort.desc ? desc : asc;
            switch (sort.id) {
                case "partyName":
                    orderBy.push(direction(loans.partyName));
                    break;
                case "amount":
                    orderBy.push(direction(loans.amount));
                    break;
                case "date":
                    orderBy.push(direction(loans.date));
                    break;
                case "dueDate":
                    orderBy.push(direction(loans.dueDate));
                    break;
            }
        });

        const { pageIndex, pageSize } = pagination;

        const query = db
            .select(projection)
            .from(loans)
            .leftJoin(payoffsSq, eq(payoffsSq.loanId, loans.id))
            .where(and(...whereFilters))
            .groupBy(loans.id)
            .having(and(...havingFilters))
            .orderBy(...orderBy);

        const items = await (pageSize === -1
            ? query
            : query.offset(pageIndex * pageSize).limit(pageSize));

        return {
            items,
            count: 0, // TODO: fix this
            filteredCount: 0, // TODO: fix this
        };
    }

    async get(id: string) {
        const items = await db
            .select(projection)
            .from(loans)
            .leftJoin(payoffsSq, eq(payoffsSq.loanId, loans.id))
            .groupBy(loans.id)
            .where(eq(loans.id, id))
            .limit(1);

        return items[0] ?? null;
    }

    async create(data: z.infer<typeof createLoanSchema>) {
        return await db.insert(loans).values(data).returning();
    }

    async update(data: z.infer<typeof updateLoanSchema>) {
        return await db
            .update(loans)
            .set(data)
            .where(eq(loans.id, data.id))
            .returning();
    }

    async delete(id: string) {
        return await db.delete(loans).where(eq(loans.id, id)).returning();
    }
}
