import { db, transactions } from "@/db";
import { createTRPCRouter, protectedProcedure } from "../init";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
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

            return await db.query.transactions.findMany({
                where: eq(transactions.accountId, accountId),
                orderBy: [desc(transactions.createdAt)],
                offset: (pageNumber ?? 0) * (pageSize ?? 0),
                limit: pageSize,
            });
        }),

    get: protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .query(async ({ input }) => {
            const item = await db.query.transactions.findFirst({
                where: eq(transactions.id, input.id),
            });

            return item ?? null;
        }),

    create: protectedProcedure
        .input(
            createTransactionSchema.omit({ id: true }).transform(v => ({
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
                // .omit({ accountId: true })
                .required({ id: true })
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
