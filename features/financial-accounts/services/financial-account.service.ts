import { db, financialAccounts, transactions } from "@/db";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
    createFinancialAccountSchema,
    updateFinancialAccountSchema,
} from "../schemas/financial-account.schema";

const projection = {
    id: financialAccounts.id,
    name: financialAccounts.name,
    balance: sql<number>`COALESCE(SUM(
        CASE
            WHEN ${transactions.type} = 'income' THEN ${transactions.amount}
            ELSE -${transactions.amount}
        END
    ), 0)`,
} as const;

export class FinancialAccountService {
    async list() {
        return await db
            .select(projection)
            .from(financialAccounts)
            .leftJoin(
                transactions,
                eq(transactions.accountId, financialAccounts.id)
            )
            .groupBy(financialAccounts.id, financialAccounts.name)
            .orderBy(desc(financialAccounts.updatedAt));
    }

    async get(id: string) {
        const items = await db
            .select(projection)
            .from(financialAccounts)
            .where(eq(financialAccounts.id, id))
            .leftJoin(
                transactions,
                eq(transactions.accountId, financialAccounts.id)
            )
            .groupBy(financialAccounts.id, financialAccounts.name)
            .limit(1);

        return items[0] ?? null;
    }

    async create(data: z.infer<typeof createFinancialAccountSchema>) {
        return await db.insert(financialAccounts).values(data).returning();
    }

    async update(data: z.infer<typeof updateFinancialAccountSchema>) {
        return await db
            .update(financialAccounts)
            .set({ name: data.name })
            .where(eq(financialAccounts.id, data.id))
            .returning();
    }

    async delete(id: string) {
        return await db
            .delete(financialAccounts)
            .where(eq(financialAccounts.id, id))
            .returning();
    }
}
