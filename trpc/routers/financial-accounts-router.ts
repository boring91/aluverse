import { db, financialAccounts, transactions } from "@/db";
import { createTRPCRouter, protectedProcedure } from "../init";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

export const financialAccountsRouter = createTRPCRouter({
    list: protectedProcedure.query(async () => {
        return await db
            .select({
                id: financialAccounts.id,
                name: financialAccounts.name,
                balance: sql<number>`COALESCE(SUM(
                    CASE
                        WHEN ${transactions.type} = 'income' THEN ${transactions.amount}
                        ELSE -${transactions.amount}
                    END
                ), 0)`,
            })
            .from(financialAccounts)
            .leftJoin(
                transactions,
                eq(transactions.accountId, financialAccounts.id)
            )
            .groupBy(financialAccounts.id, financialAccounts.name)
            .orderBy(desc(financialAccounts.updatedAt));
    }),

    get: protectedProcedure
        .input(
            z.object({
                id: z.uuid(),
            })
        )
        .query(async ({ input }) => {
            const items = await db
                .select({
                    id: financialAccounts.id,
                    name: financialAccounts.name,
                    balance: sql<number>`COALESCE(SUM(
                        CASE
                            WHEN ${transactions.type} = 'income' THEN ${transactions.amount}
                            ELSE -${transactions.amount}
                        END
                    ), 0)`,
                })
                .from(financialAccounts)
                .where(eq(financialAccounts.id, input.id))
                .leftJoin(
                    transactions,
                    eq(transactions.accountId, financialAccounts.id)
                )
                .groupBy(financialAccounts.id, financialAccounts.name)
                .limit(1);

            return items[0] ?? null;
        }),

    create: protectedProcedure
        .input(
            z.object({
                name: z.string(),
            })
        )
        .mutation(async ({ input }) => {
            return await db.insert(financialAccounts).values(input).returning();
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.uuid(),
                name: z.string(),
            })
        )
        .mutation(async ({ input }) => {
            return await db
                .update(financialAccounts)
                .set(input)
                .where(eq(financialAccounts.id, input.id))
                .returning();
        }),

    delete: protectedProcedure
        .input(
            z.object({
                id: z.uuid(),
            })
        )
        .mutation(async ({ input }) => {
            return await db
                .delete(financialAccounts)
                .where(eq(financialAccounts.id, input.id))
                .returning();
        }),
});
