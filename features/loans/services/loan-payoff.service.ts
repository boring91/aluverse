import { SQL, desc, asc, and, count, eq } from "drizzle-orm";
import { db, loanPayoffs } from "@/db";
import { z } from "zod";
import {
    createLoanPayoffSchemaWithLoanId,
    listLoanPayoffSchema,
    updateLoanPayoffSchema,
} from "../schemas/loan-payoff.schema";

const payoffProjection = {
    id: loanPayoffs.id,
    amount: loanPayoffs.amount,
    date: loanPayoffs.date,
    notes: loanPayoffs.notes,
} as const;

export class LoanPayoffService {
    async list(input: z.infer<typeof listLoanPayoffSchema>) {
        const { loanId, pagination, sorting } = input;

        const filters: SQL[] = [eq(loanPayoffs.loanId, loanId)];

        const orderBy: SQL[] = [];
        sorting?.forEach(sort => {
            const direction = sort.desc ? desc : asc;
            switch (sort.id) {
                case "date":
                    orderBy.push(direction(loanPayoffs.date));
                    break;
                case "amount":
                    orderBy.push(direction(loanPayoffs.amount));
                    break;
            }
        });

        const { pageIndex, pageSize } = pagination;
        const query = db
            .select(payoffProjection)
            .from(loanPayoffs)
            .where(and(...filters))
            .orderBy(...orderBy);

        const items = await (pageSize === -1
            ? query
            : query.offset(pageIndex * pageSize).limit(pageSize));

        const { filteredCount } = (
            await db.select({ filteredCount: count() }).from(loanPayoffs)
        )[0];

        const { _count } = (
            await db
                .select({ _count: count() })
                .from(loanPayoffs)
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
            .select(payoffProjection)
            .from(loanPayoffs)
            .where(eq(loanPayoffs.id, id))
            .limit(1);

        return items[0] ?? null;
    }

    async create(data: z.infer<typeof createLoanPayoffSchemaWithLoanId>) {
        return await db.insert(loanPayoffs).values(data).returning();
    }

    async update(data: z.infer<typeof updateLoanPayoffSchema>) {
        return await db
            .update(loanPayoffs)
            .set(data)
            .where(eq(loanPayoffs.id, data.id))
            .returning();
    }

    async delete(id: string) {
        return await db
            .delete(loanPayoffs)
            .where(eq(loanPayoffs.id, id))
            .returning();
    }
}
