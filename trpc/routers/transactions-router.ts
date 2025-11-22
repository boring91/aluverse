import { db, transactions } from "@/db";
import { createTRPCRouter, protectedProcedure } from "../init";
import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";
import { createTransactionSchema } from "@/lib/trpc-schemas";

export const transactionsRouter = createTRPCRouter({
    list: protectedProcedure
        .input(
            z.object({
                accountId: z.uuid(),
                pageNumber: z.number().optional(),
                pageSize: z.number().optional(),
            })
        )
        .query(async ({ input }) => {
            const { accountId, pageNumber, pageSize } = input;

            return db
                .select({
                    id: transactions.id,
                    date: transactions.date,
                    amount: sql<number>`${transactions.amount}`,
                    type: transactions.type,
                    description: transactions.description,
                })
                .from(transactions)
                .where(eq(transactions.accountId, accountId))
                .orderBy(desc(transactions.createdAt));
            // .offset((pageNumber ?? 0) * (pageSize ?? 0))
            // .limit(pageSize ?? 0);
        }),

    get: protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .query(async ({ input }) => {
            const items = await db
                .select({
                    id: transactions.id,
                    date: transactions.date,
                    amount: sql<number>`${transactions.amount}`,
                    type: transactions.type,
                    description: transactions.description,
                })
                .from(transactions)
                .where(eq(transactions.id, input.id))
                .limit(1);

            return items[0] ?? null;
        }),

    create: protectedProcedure
        .input(
            createTransactionSchema
                .extend({
                    accountId: z.uuid(),
                })
                .transform(v => ({
                    ...v,
                    amount: v.amount * 100,
                }))
        )
        .mutation(async ({ input }) => {
            return await db.insert(transactions).values(input).returning();
        }),

    update: protectedProcedure
        .input(
            createTransactionSchema
                .extend({
                    id: z.uuid(),
                })
                .transform(v => ({
                    ...v,
                    amount: v.amount * 100,
                }))
        )
        .mutation(async ({ input }) => {
            return await db
                .update(transactions)
                .set(input)
                .where(eq(transactions.id, input.id))
                .returning();
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return await db
                .delete(transactions)
                .where(eq(transactions.id, input.id))
                .returning();
        }),
});
