import { consolidations, db, transactions } from "@/db";
import { createTRPCRouter, protectedProcedure } from "../init";
import { z } from "zod";
import { count, desc, asc, eq, ilike, and } from "drizzle-orm";
import { createTransactionSchema } from "@/lib/trpc-schemas";
import { listSchema } from "@/lib/util-schemas";

const projection = {
    id: transactions.id,
    date: transactions.date,
    amount: transactions.amount,
    type: transactions.type,
    description: transactions.description,
} as const;

export const transactionsRouter = createTRPCRouter({
    list: protectedProcedure
        .input(
            listSchema.extend({
                accountId: z.string().optional(),
            })
        )
        .query(async ({ input }) => {
            const { accountId, pagination, sorting, columnFilters } = input;

            const filters = accountId
                ? [eq(transactions.accountId, accountId)]
                : [];

            if (columnFilters) {
                for (const filter of columnFilters) {
                    if (
                        filter.id === "description" &&
                        typeof filter.value === "string"
                    ) {
                        filters.push(
                            ilike(transactions.description, `%${filter.value}%`)
                        );
                    }
                }
            }

            const orderBy = [];
            if (sorting && sorting.length > 0) {
                sorting.forEach(sort => {
                    const direction = sort.desc ? desc : asc;
                    switch (sort.id) {
                        case "date":
                            orderBy.push(direction(transactions.date));
                            break;
                        case "description":
                            orderBy.push(direction(transactions.description));
                            break;
                        case "amount":
                            orderBy.push(direction(transactions.amount));
                            break;
                        default:
                            orderBy.push(desc(transactions.date));
                    }
                });
            } else {
                orderBy.push(desc(transactions.date));
            }

            const { pageIndex, pageSize } = pagination;
            const items = await db
                .select(projection)
                .from(transactions)
                .where(and(...filters))
                .orderBy(...orderBy)
                .offset(pageIndex * pageSize)
                .limit(pageSize);

            const { _count } = (
                await db.select({ _count: count() }).from(transactions)
            )[0];

            const { filteredCount } = (
                await db
                    .select({ filteredCount: count() })
                    .from(transactions)
                    .where(and(...filters))
            )[0];

            return {
                items,
                count: _count,
                filteredCount,
            };
        }),

    get: protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .query(async ({ input }) => {
            const items = await db
                .select(projection)
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
            const transaction = (
                await db.insert(transactions).values(input).returning()
            )[0];

            // Create a consolidation for it
            await db.insert(consolidations).values({
                transactionId: transaction.id,
                amount: transaction.amount,
                isGst: true,
            });

            return transaction;
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
            const transaction = (
                await db
                    .update(transactions)
                    .set(input)
                    .where(eq(transactions.id, input.id))
                    .returning()
            )[0];

            // recreate consolidation
            await db
                .delete(consolidations)
                .where(eq(consolidations.transactionId, transaction.id));
            await db.insert(consolidations).values({
                transactionId: transaction.id,
                amount: transaction.amount,
                isGst: true,
            });

            return transaction;
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
