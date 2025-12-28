import {
    asc,
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
import { defineQuery, leftJoin } from "@/lib/server-utils";

const payoffsSq = db
    .select({
        loanId: loanPayoffs.loanId,
        total: sum(loanPayoffs.amount).as("payoffTotal"),
    })
    .from(loanPayoffs)
    .groupBy(loanPayoffs.loanId)
    .as("payoffsSq");

const loansQuery = defineQuery({
    from: loans,
    key: "id",
    projection: {
        id: loans.id,
        type: loans.type,
        partyName: loans.partyName,
        amount: loans.amount,
        date: loans.date,
        dueDate: loans.dueDate,
        notes: loans.notes,
        paid: sql<number>`COALESCE(SUM(${payoffsSq.total}), 0)`.as("paid"),
        remaining: sql<number>`${loans.amount} - COALESCE(SUM(${payoffsSq.total}), 0)`.as(
            "remaining"
        ),
    },
    joins: [leftJoin(payoffsSq, eq(payoffsSq.loanId, loans.id))],
    groupBy: [loans.id],
});

export class LoanService {
    private buildFilters(filterInput?: z.infer<typeof listLoanSchema>["filters"]) {
        const where: SQL[] = [];
        const having: SQL[] = [];

        if (!filterInput) {
            return { where, having };
        }

        if (filterInput.keyword) {
            where.push(
                ilike(loans.partyName, "%" + filterInput.keyword + "%")
            );
        }

        if (filterInput.type) {
            where.push(eq(loans.type, filterInput.type));
        }

        if (filterInput.isPaidOff !== undefined) {
            if (filterInput.isPaidOff) {
                // Paid off: remaining = 0
                having.push(
                    sql`${loans.amount} - COALESCE(SUM(${payoffsSq.total}), 0) = 0`
                );
            } else {
                // Not paid off: remaining > 0
                having.push(
                    sql`${loans.amount} - COALESCE(SUM(${payoffsSq.total}), 0) > 0`
                );
            }
        }

        if (filterInput.from) {
            where.push(gte(loans.date, filterInput.from));
        }

        if (filterInput.to) {
            where.push(lte(loans.date, filterInput.to));
        }

        return { where, having };
    }

    private buildOrderBy(sorting?: z.infer<typeof listLoanSchema>["sorting"]) {
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

        return orderBy;
    }

    async list(input: z.infer<typeof listLoanSchema>) {
        const { pagination, sorting, filters } = input;
        const { where, having } = this.buildFilters(filters);
        const orderBy = this.buildOrderBy(sorting);

        return await loansQuery.list({
            where,
            having,
            orderBy,
            pagination,
        });
    }

    async get(id: string) {
        return await loansQuery.get({
            where: [eq(loans.id, id)],
        });
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
