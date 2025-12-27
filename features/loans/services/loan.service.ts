import { and, asc, count, desc, eq, SQL, sql, sum } from "drizzle-orm";
import { db, loans, loanPayoffs } from "@/db";
import { listSchema } from "@/shared/lib/schemas/util-schemas";
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
    async list(input: z.infer<typeof listSchema>) {
        const { pagination, sorting } = input;

        const filters: SQL[] = [];

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
            .groupBy(loans.id)
            .orderBy(...orderBy);

        const items = await (pageSize === -1
            ? query
            : query.offset(pageIndex * pageSize).limit(pageSize));

        const { filteredCount } = (
            await db.select({ filteredCount: count() }).from(loans)
        )[0];

        const { _count } = (
            await db
                .select({ _count: count() })
                .from(loans)
                .where(and(...filters))
        )[0];

        return {
            items,
            count: _count,
            filteredCount,
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
